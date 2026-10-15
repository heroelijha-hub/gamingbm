'use server';

import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const ALLOWED_PAYMENT_METHODS = ['STRIPE', 'PAYPAL', 'BANK_TRANSFER'] as const;
const MAX_CART_LINES = 50;
const MAX_QTY_PER_LINE = 999;

export async function validateCoupon(code: string) {
  try {
    const ip = await getClientIp();
    const rl = await checkRateLimit(`coupon_${ip}`, 10, 60); // 10 attempts per minute
    if (!rl.success) {
      return { error: "Trop de tentatives de code promo. Veuillez patienter un instant." };
    }

    if (!code || typeof code !== 'string' || code.trim().length === 0 || code.length > 50) {
      return { error: "Code promo invalide." };
    }
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      return { error: "Invalid coupon code." };
    }

    if (!coupon.isActive) {
      return { error: "This coupon code is no longer active." };
    }

    return { 
      success: true, 
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      } 
    };
  } catch (error) {
    console.error("Coupon validation error:", error);
    return { error: "Error validating the coupon code." };
  }
}


export async function processCheckout(formData: FormData, cartItems: any[], finalTotal: number, paymentMethod: string) {
  try {
    const ip = await getClientIp();
    const rl = await checkRateLimit(`checkout_${ip}`, 10, 60); // 10 checkouts per min
    if (!rl.success) {
      return { error: "Too many checkout requests. Please wait a moment." };
    }

    const email = String(formData.get('email') || '').trim().toLowerCase();
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const country = formData.get('country') as string;
    const shippingMethodId = formData.get('shippingMethod') as string;
    const shipToDifferentAddress = formData.get('shipToDifferentAddress') === 'on';
    const shippingCountry = formData.get('shippingCountry') as string;
    
    const effectiveCountry = shipToDifferentAddress ? shippingCountry : country;

    // ===== INPUT VALIDATION (never trust the client) =====
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Please provide a valid email address." };
    }

    if (!(ALLOWED_PAYMENT_METHODS as readonly string[]).includes(paymentMethod)) {
      return { error: "Invalid payment method." };
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return { error: "Your cart is empty." };
    }
    if (cartItems.length > MAX_CART_LINES) {
      return { error: "Too many items in cart." };
    }

    // Validate shippingMethodId is a valid UUID to prevent Prisma P2023 errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    for (const item of cartItems) {
      const qty = Number(item?.quantity);
      if (!item || typeof item.productId !== 'string' || !uuidRegex.test(item.productId)) {
        return { error: "Invalid product in cart. Please refresh your cart." };
      }
      // SECURITY: negative / fractional / huge quantities would alter the total
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
        return { error: "Invalid quantity in cart." };
      }
      item.quantity = qty;
    }

    if (!shippingMethodId || !uuidRegex.test(shippingMethodId)) {
      return { error: "Invalid shipping method. Please refresh the page." };
    }

    // Check that the selected payment method is enabled by the admin
    const paymentFlags = await prisma.setting.findMany({
      where: { key: { in: ['ENABLE_STRIPE', 'ENABLE_PAYPAL', 'ENABLE_BANK_TRANSFER'] } }
    });
    const flagMap = Object.fromEntries(paymentFlags.map(s => [s.key, s.value]));
    const flagKey = paymentMethod === 'BANK_TRANSFER' ? 'ENABLE_BANK_TRANSFER' : `ENABLE_${paymentMethod}`;
    if (flagMap[flagKey] === 'false') {
      return { error: "This payment method is not available." };
    }

    const validZone = await prisma.shippingZone.findFirst({
      where: { name: effectiveCountry, isActive: true },
      include: { methods: { where: { id: shippingMethodId, isActive: true } } }
    });

    if (!validZone) {
      return { error: "This shipping zone is not currently covered." };
    }

    if (!validZone.methods || validZone.methods.length === 0) {
      return { error: "Invalid shipping method." };
    }

    const shippingRate = validZone.methods[0].rate;
    
    // ===== SERVER-SIDE PRICE VERIFICATION =====
    // Never trust client-provided prices. Fetch real prices from database.
    const productIds = [...new Set(cartItems.map((item: any) => item.productId as string))];
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, isDeleted: false },
      select: { id: true, price: true, title: true, images: true, variations: true },
    });
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    // Verify all products exist and recalculate total from DB prices
    let serverCartTotal = 0;
    const verifiedItems: any[] = [];
    for (const item of cartItems) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        return { error: `A product in your cart is no longer available. Please refresh your cart.` };
      }

      let itemPrice = dbProduct.price;
      let itemImage = dbProduct.images?.[0] || '';

      // Check if item has a variation with a specific price
      if (item.variationId && Array.isArray(dbProduct.variations)) {
        const foundVar = (dbProduct.variations as any[]).find(
          (v: any) => v && String(v.id) === String(item.variationId)
        );
        if (foundVar) {
          if (foundVar.price) {
            const parsedVarPrice = parseFloat(String(foundVar.price));
            if (!isNaN(parsedVarPrice) && parsedVarPrice > 0) {
              itemPrice = parsedVarPrice;
            }
          }
          if (foundVar.image && typeof foundVar.image === 'string') {
            itemImage = foundVar.image;
          }
        }
      }

      serverCartTotal += itemPrice * item.quantity;
      verifiedItems.push({
        productId: dbProduct.id,
        quantity: item.quantity,
        price: itemPrice, // Use DB price or variation price, not client price
        title: dbProduct.title, // Use DB title, not client title
        image: itemImage,
        variationId: typeof item.variationId === 'string' ? item.variationId.slice(0, 100) : null,
        attributes: item.attributes && typeof item.attributes === 'object' ? item.attributes : null,
      });
    }

    // Apply coupon discount server-side if provided
    const couponCode = String(formData.get('couponCode') || '').slice(0, 64);
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });
      if (coupon && coupon.isActive) {
        if (coupon.type === 'PERCENTAGE') {
          discountAmount = serverCartTotal * (coupon.value / 100);
        } else {
          discountAmount = Math.min(coupon.value, serverCartTotal);
        }
      }
    }

    const serverTotal = Math.max(0, serverCartTotal - discountAmount) + shippingRate;
    // Round to 2 decimal places to avoid floating point issues
    const verifiedTotal = Math.round(serverTotal * 100) / 100;

    
    // Find or link user
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    let user = null;
    if (authUser) {
      user = await prisma.user.findUnique({ where: { id: authUser.id } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: authUser.id,
            email: authUser.email || email,
            role: 'CUSTOMER',
          }
        });
      }
    } else {
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            role: 'CUSTOMER',
          }
        });
      }
    }

    const orderMetadata = {
      billing: {
        firstName,
        lastName,
        email,
        phone: formData.get('phone') as string,
        address1: formData.get('address1') as string,
        address2: formData.get('address2') as string,
        city: formData.get('city') as string,
        postalCode: formData.get('postalCode') as string,
        country: country
      },
      shipping: shipToDifferentAddress ? {
        firstName: formData.get('shippingFirstName') as string,
        lastName: formData.get('shippingLastName') as string,
        company: formData.get('shippingCompany') as string,
        phone: formData.get('shippingPhone') as string,
        address1: formData.get('shippingAddress1') as string,
        address2: formData.get('shippingAddress2') as string,
        city: formData.get('shippingCity') as string,
        postalCode: formData.get('shippingPostalCode') as string,
        country: shippingCountry
      } : null,
      shippingCost: shippingRate,
      shippingMethodName: validZone.methods[0].type,
      subTotal: serverCartTotal,
      discount: discountAmount,
      couponCode: couponCode || null,
    };

    // Create the order with SERVER-VERIFIED total (status PENDING for all methods)
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total: verifiedTotal,
        paymentMethod: paymentMethod as any,
        status: 'PENDING',
        orderItems: {
          create: verifiedItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price, // DB-verified price
            variationId: item.variationId || null,
            attributes: item.attributes || null
          }))
        },
        destinationAddress: JSON.stringify(orderMetadata)
      }
    });

    // Fetch settings once for currency and payment config
    const allSettings = await prisma.setting.findMany();
    const settingsMap = allSettings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
    const storeCurrencyCode = settingsMap.currency || 'EUR';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.topkaminbrennstoffe.com';

    // ===== PAYMENT METHOD HANDLING =====
    // For STRIPE and PAYPAL: finalization (emails, stock, notifications) is deferred
    // to the webhook/capture handler AFTER payment is confirmed.
    // For BANK_TRANSFER: finalize immediately since no online payment is needed.

    if (paymentMethod === 'STRIPE') {
      const stripeSecretKey = settingsMap['STRIPE_SECRET_KEY'];
      if (!stripeSecretKey) {
        return { error: "Card payment (Stripe) has not been configured by the administrator yet." };
      }

      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(stripeSecretKey);
      const currency = storeCurrencyCode.toLowerCase();

      const lineItems: any[] = verifiedItems.map(item => ({
        price_data: {
          currency,
          product_data: {
            name: item.title,
            images: item.image && /^https:\/\//.test(item.image) ? [item.image] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

      // Charge shipping (previously missing -> amount paid != order total)
      if (shippingRate > 0) {
        lineItems.push({
          price_data: {
            currency,
            product_data: { name: `Versand (${validZone.methods[0].type})` },
            unit_amount: Math.round(shippingRate * 100),
          },
          quantity: 1,
        });
      }

      // Apply the server-verified coupon discount on Stripe as well
      let discounts: any[] | undefined;
      const discountCents = Math.round(discountAmount * 100);
      if (discountCents > 0) {
        const stripeCoupon = await stripe.coupons.create({
          amount_off: discountCents,
          currency,
          duration: 'once',
          max_redemptions: 1,
          name: couponCode ? `Gutschein ${couponCode.toUpperCase()}` : 'Rabatt',
        });
        discounts = [{ coupon: stripeCoupon.id }];
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        ...(discounts ? { discounts } : {}),
        mode: 'payment',
        success_url: `${baseUrl}/checkout/success?orderId=${order.id}`,
        cancel_url: `${baseUrl}/checkout`,
        client_reference_id: order.id,
        customer_email: user.email,
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id }
      });

      // NOTE: Emails, stock, notifications will be handled by the Stripe webhook
      // at /api/stripe/webhook after payment confirmation.
      return { success: true, orderId: order.id, redirectUrl: session.url };
    } 
    else if (paymentMethod === 'PAYPAL') {
      const paypalClientId = settingsMap['PAYPAL_CLIENT_ID'];
      const paypalSecret = settingsMap['PAYPAL_SECRET'];
      
      if (!paypalClientId || !paypalSecret) {
        return { error: "PayPal payment has not been configured by the administrator yet." };
      }
      
      const auth = Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64');
      const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        return { error: "PayPal authentication error. Check the keys in Admin." };
      }

      const orderRes = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: order.id,
            amount: {
              currency_code: storeCurrencyCode,
              value: verifiedTotal.toFixed(2)
            }
          }],
          application_context: {
            // Redirect to capture route instead of success page
            // The capture route will verify payment before showing success
            return_url: `${baseUrl}/api/paypal/capture?orderId=${order.id}`,
            cancel_url: `${baseUrl}/checkout`
          }
        })
      });
      
      const orderData = await orderRes.json();
      const approveLink = orderData.links?.find((l: any) => l.rel === 'approve');
      
      if (approveLink) {
        // NOTE: Emails, stock, notifications will be handled by the PayPal capture
        // route at /api/paypal/capture after payment confirmation.
        return { success: true, orderId: order.id, redirectUrl: approveLink.href };
      } else {
        return { error: "Unable to create PayPal payment session." };
      }
    } 
    else {
      // BANK_TRANSFER — Finalize immediately (no online payment to confirm)
      const { finalizeOrder } = await import('@/lib/orderFinalizer');
      finalizeOrder(order.id).catch(e => console.error('Bank transfer finalization failed', e));
      
      return { success: true, orderId: order.id, redirectUrl: '/checkout/success?orderId=' + order.id };
    }

  } catch (error: any) {
    console.error("Checkout error:", error);
    return { error: "Une erreur est survenue lors de la commande." };
  }
}
