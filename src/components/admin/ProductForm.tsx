'use client';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCategories, getBrands, createBrandAction, createProduct, uploadImage, getMinimalProducts } from '@/actions/admin';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import MediaPickerModal from './MediaPickerModal';
import Image from "next/image";

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function ProductForm({ initialData }: { initialData?: any }) {
  const t = useTranslations('AdminProducts');

  const router = useRouter();
  const parseJSON = (data: any, fallback: any = []) => {
    if (!data) return fallback;
    if (typeof data === 'string') {
      try { return JSON.parse(data); } catch { return fallback; }
    }
    if (Array.isArray(data)) return data;
    return fallback;
  };

  const initialAttributes = parseJSON(initialData?.attributes);
  const initialVariations = parseJSON(initialData?.variations);
  const rawTags = parseJSON(initialData?.tags);
  const initialTags = rawTags.map((t: any) => typeof t === 'string' ? t : t.name).filter(Boolean);

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.categories?.map((c: any) => c.id) || []);
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>(initialData?.brandId || '');
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandLogo, setNewBrandLogo] = useState('');
  const [showBrandMediaPicker, setShowBrandMediaPicker] = useState(false);

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [forceSalesIds, setForceSalesIds] = useState<string[]>(initialData?.forceSales?.map((p: any) => p.id) || []);
  const [saleTogetherIds, setSaleTogetherIds] = useState<string[]>(initialData?.saleTogether?.map((p: any) => p.id) || []);
  const [forceSalesSearch, setForceSalesSearch] = useState('');
  const [saleTogetherSearch, setSaleTogetherSearch] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>(parseJSON(initialData?.images));
  const [draggedImageIdx, setDraggedImageIdx] = useState<number | null>(null);
  const [showProductMediaPicker, setShowProductMediaPicker] = useState(false);
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || '');
  
  // Prix régulier = ancien prix barré (compareAtPrice en BDD)
  // Prix promotionnel = prix payé par le client (price en BDD)
  const [regularPrice, setRegularPrice] = useState(initialData?.compareAtPrice?.toString() || '');
  const [salePrice, setSalePrice] = useState(initialData?.price?.toString() || '');
  const [gtin, setGtin] = useState(initialData?.gtin || '');
  
  // Erreur si le prix promo est supérieur ou égal au prix régulier (promo doit être < régulier)
  const priceError = (salePrice && regularPrice && Number(salePrice) >= Number(regularPrice)) 
    ? t('price_error_msg') 
    : "";

  // Helper to slugify
  const generateSlug = (text: string) => 
    text.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!isEditing) {
      setSlug(generateSlug(newTitle));
    }
  };

  useEffect(() => {
    getCategories().then(setCategories);
    getBrands().then(setBrands);
    getMinimalProducts().then(prods => {
      // Exclude current product if editing
      setAllProducts(prods.filter((p: any) => p.id !== initialData?.id));
    });
  }, [initialData?.id]);

  const [productType, setProductType] = useState<'SIMPLE' | 'VARIABLE'>(initialData?.type || 'SIMPLE');
  const [attributes, setAttributes] = useState<Array<{ name: string, options: string }>>(
    initialAttributes.map((a: any) => ({ 
      name: a?.name || '', 
      options: Array.isArray(a?.options) ? a.options.join(' | ') : (a?.options || '') 
    }))
  );
  const [variations, setVariations] = useState<Array<any>>(initialVariations);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');

  const addAttribute = () => setAttributes([...attributes, { name: '', options: '' }]);
  const removeAttribute = (idx: number) => setAttributes(attributes.filter((_, i) => i !== idx));

  const addVariation = () => setVariations([...variations, { id: crypto.randomUUID(), attributes: {}, price: '', stock: '' }]);
  const removeVariation = (id: string) => setVariations(variations.filter(v => v.id !== id));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (priceError) {
        setIsLoading(false);
        return;
      }
      
      const formData = new FormData(e.currentTarget);
      
      // Formatting attributes and variations to send as JSON string
      const formattedAttributes = attributes.map(a => ({
        name: a.name,
        options: a.options.split('|').map(o => o.trim()).filter(Boolean)
      })).filter(a => a.name && a.options.length > 0);
      
      let finalBrandId = selectedBrand;

      if (showNewBrand && newBrandName) {
        const brandFormData = new FormData();
        brandFormData.append('name', newBrandName);
        let logoUrl = newBrandLogo;
        const brandRes = await createBrandAction(brandFormData, logoUrl);
        if (brandRes.success && brandRes.brand) {
          finalBrandId = brandRes.brand.id;
        }
      }

      if (finalBrandId) {
        formData.append('brandId', finalBrandId);
      }

      formData.append('attributes', JSON.stringify(formattedAttributes));
      formData.append('variations', JSON.stringify(variations));
      formData.append('tags', JSON.stringify(tags));
      formData.append('forceSalesIds', JSON.stringify(forceSalesIds));
      formData.append('saleTogetherIds', JSON.stringify(saleTogetherIds));
      
      // Prevent original submit if textareas were still present
      formData.delete('shortDescription');
      formData.delete('description');
      
      formData.append('shortDescription', shortDescription);
      formData.append('description', description);
      formData.append('metaTitle', metaTitle);
      formData.append('metaDescription', metaDescription);
      
      const imageUrls: string[] = [...existingImages];

      formData.append('slug', slug);
      formData.append('categoryIds', JSON.stringify(selectedCategories));
      if (gtin) formData.append('gtin', gtin);

      // If editing, we will call updateProduct (to be created), otherwise createProduct
      if (isEditing) {
        formData.append('id', initialData.id);
        const { updateProduct } = await import('@/actions/admin');
        const res = await updateProduct(initialData.id, formData, imageUrls);
        if (res.error) alert(res.error);
        else router.push('/admin/products');
      } else {
        const res = await createProduct(formData, imageUrls);
        if (res.error) {
          alert(res.error);
        } else {
          router.push('/admin/products');
        }
      }
    } catch (err) {
      alert(t('save_error'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {isEditing ? `${t('update_product_btn')} : ${initialData.title}` : t('add_product')}
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Product type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("product_type")}</label>
          <select 
            name="type" 
            value={productType} 
            onChange={(e) => setProductType(e.target.value as any)} 
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-50 font-semibold"
          >
            <option value="SIMPLE">{t("simple_product")}</option>
            <option value="VARIABLE">{t("variable_product")}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('product_title_label')}</label>
            <input 
              type="text" 
              name="title" 
              value={title} 
              onChange={handleTitleChange} 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('slug_label')}</label>
            <input 
              type="text" 
              name="slug" 
              value={slug} 
              onChange={(e) => setSlug(e.target.value)} 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-50" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('categories_label')}</label>
            <div className="border border-gray-300 rounded-md p-4 max-h-48 overflow-y-auto bg-gray-50 flex flex-col gap-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.includes(cat.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, cat.id]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                      }
                    }}
                    className="rounded border-gray-300 text-orange-700 focus:ring-orange-500"
                  />
                  {cat.parent ? `${cat.parent.name} > ${cat.name}` : cat.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Marque */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Marque</label>
            <select
              value={selectedBrand}
              onChange={(e) => {
                if (e.target.value === 'new') {
                  setShowNewBrand(true);
                  setSelectedBrand('');
                } else {
                  setShowNewBrand(false);
                  setSelectedBrand(e.target.value);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-white"
            >
              <option value="">{t('no_brand')}</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
              <option value="new" className="font-bold text-orange-700">{t('add_new_brand')}</option>
            </select>
            
            {showNewBrand && (
              <div className="mt-4 p-4 border border-orange-200 bg-orange-50 rounded-md space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('brand_name_label')}</label>
                  <input 
                    type="text" 
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder={t('brand_name_placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('brand_logo_label')}</label>
                  {newBrandLogo && (
                    <Image width={800} height={800} src={newBrandLogo} alt="Logo" className="h-12 w-auto mb-2 border rounded" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowBrandMediaPicker(true)}
                    className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded text-sm font-semibold hover:bg-gray-200 transition"
                  >
                    Choisir un logo
                  </button>
                  {showBrandMediaPicker && (
                    <MediaPickerModal 
                      onClose={() => setShowBrandMediaPicker(false)}
                      onSelect={(url) => {
                        setNewBrandLogo(url);
                        setShowBrandMediaPicker(false);
                      }}
                    />
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowNewBrand(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  {t('cancel_brand')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Price & Stock (for simple product or base price) */}
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix de vente (actuel) *</label>
            <input 
              type="number" step="0.01" name="price" 
              value={salePrice} 
              onChange={(e) => setSalePrice(e.target.value)} 
              required
              className={`w-full px-4 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 ${priceError ? 'border-red-500' : 'border-gray-300'}`} 
            />
            {priceError && <p className="text-red-500 text-xs font-semibold mt-1">{priceError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ancien prix barré <span className="text-gray-400 font-normal">(si promo)</span></label>
            <input 
              type="number" step="0.01" name="compareAtPrice" 
              value={regularPrice} 
              onChange={(e) => setRegularPrice(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-50" 
              placeholder="ex: 299.99"
            />
          </div>
          {productType === 'SIMPLE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('stock_label')}</label>
              <input type="number" name="stock" defaultValue={initialData?.stock ?? ''} placeholder={t('stock_placeholder')} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" />
            </div>
          )}
        </div>

        {/* GTIN / EAN */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            GTIN / EAN / Code-barres <span className="text-gray-500 font-normal">(optionnel)</span>
          </label>
          <input 
            type="text" 
            value={gtin}
            onChange={(e) => setGtin(e.target.value)}
            placeholder="ex: 4006381333931"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Si non renseigné, ce champ ne s'affichera pas sur la page produit.</p>
        </div>

        {/* Attributes & Variations */}
        {productType === 'VARIABLE' && (
          <div className="border border-blue-200 bg-blue-50/30 p-6 rounded-lg space-y-8">
            {/* Attributes section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t("attributes")}</h3>
                <button type="button" onClick={addAttribute} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">
                  {t('add_attribute_btn')}
                </button>
              </div>
              <div className="space-y-3">
                {attributes.map((attr, idx) => (
                  <div key={idx} className="flex gap-4 items-start bg-white p-3 border border-gray-200 rounded">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">{t('attr_name_label')}</label>
                      <input 
                        type="text" 
                        value={attr.name} 
                        onChange={e => { const newAttr = [...attributes]; newAttr[idx].name = e.target.value; setAttributes(newAttr); }}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                        placeholder={t('attr_name_placeholder')}
                      />
                    </div>
                    <div className="flex-[2]">
                      <label className="block text-xs text-gray-500 mb-1">{t('attr_val_label')}</label>
                      <input 
                        type="text" 
                        value={attr.options} 
                        onChange={e => { const newAttr = [...attributes]; newAttr[idx].options = e.target.value; setAttributes(newAttr); }}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                        placeholder={t('attr_val_placeholder')}
                      />
                    </div>
                    <button type="button" onClick={() => removeAttribute(idx)} className="mt-6 text-red-500 hover:text-red-700 p-1">
                      &times;
                    </button>
                  </div>
                ))}
                {attributes.length === 0 && <p className="text-sm text-gray-500 italic">{t("no_attributes")}</p>}
              </div>
            </div>

            {/* Variations section */}
            <div className="border-t border-blue-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t("variations")}</h3>
                <button type="button" onClick={addVariation} disabled={attributes.length === 0} className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 disabled:opacity-50">
                  {t('add_variation_btn')}
                </button>
              </div>
              <div className="space-y-3">
                {variations.map((v, idx) => (
                  <div key={v.id} className="bg-white p-4 border border-gray-200 rounded shadow-sm relative">
                    <button type="button" onClick={() => removeVariation(v.id)} className="absolute top-2 right-2 text-red-500 font-bold hover:text-red-700">
                      &times;
                    </button>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {attributes.map(attr => (
                        <div key={attr.name}>
                          <label className="block text-xs text-gray-500 mb-1">{attr.name || 'Attribute'}</label>
                          <select 
                            value={v.attributes[attr.name] || ''}
                            onChange={e => {
                              const newV = [...variations];
                              newV[idx].attributes[attr.name] = e.target.value;
                              setVariations(newV);
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          >
                            <option value="">Select...</option>
                            {attr.options.split('|').map(o => o.trim()).filter(Boolean).map(o => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">{t('variation_price_label')}</label>
                        <input 
                          type="number" step="0.01" 
                          value={v.price} 
                          onChange={e => { const newV = [...variations]; newV[idx].price = e.target.value; setVariations(newV); }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder={t('variation_price_placeholder')}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">{t('variation_stock_label')}</label>
                        <input 
                          type="number" 
                          value={v.stock} 
                          onChange={e => { const newV = [...variations]; newV[idx].stock = e.target.value; setVariations(newV); }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder={t('variation_stock_placeholder')}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {variations.length === 0 && <p className="text-sm text-gray-500 italic">{t("add_variation_desc")}</p>}
              </div>
            </div>

          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('image_gallery_label')}</label>
          <p className="text-xs text-gray-500 mb-2">{t("image_gallery_desc")}</p>
          {existingImages.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {existingImages.map((img: string, idx: number) => (
                <div 
                  key={idx} 
                  className="relative group cursor-move"
                  draggable
                  onDragStart={() => setDraggedImageIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedImageIdx === null || draggedImageIdx === idx) return;
                    const newImages = [...existingImages];
                    const draggedImg = newImages[draggedImageIdx];
                    newImages.splice(draggedImageIdx, 1);
                    newImages.splice(idx, 0, draggedImg);
                    setExistingImages(newImages);
                    setDraggedImageIdx(null);
                  }}
                >
                  <Image width={800} height={800} src={img} alt={`img-${idx}`} className="h-20 w-20 object-cover rounded border" />
                  <button 
                    type="button" 
                    onClick={() => setExistingImages(existingImages.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                  >
                    &times;
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] text-center opacity-0 group-hover:opacity-100 transition">
                    Order: {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              onClick={() => setShowProductMediaPicker(true)}
              className="px-4 py-2 border border-orange-500 rounded-md text-sm font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 h-[42px] transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Ajouter une image
            </button>
          </div>

          {showProductMediaPicker && (
            <MediaPickerModal 
              onClose={() => setShowProductMediaPicker(false)} 
              onSelect={(url) => {
                setExistingImages([...existingImages, url]);
                setShowProductMediaPicker(false);
              }} 
            />
          )}
        </div>

        {/* Short & Long Description */}
        <div className="space-y-8 pb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("short_desc")}</label>
            <div className="bg-white">
              <ReactQuill theme="snow" value={shortDescription} onChange={setShortDescription} className="h-32 mb-10" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("long_desc")}</label>
            <div className="bg-white">
              <ReactQuill theme="snow" value={description} onChange={setDescription} className="h-64 mb-12" />
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">SEO (Référencement)</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre SEO (Title)</label>
            <input 
              type="text" 
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="ex: Kaminholz kaufen | Kammergetrocknet"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Méta Description</label>
            <textarea 
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="ex: Günstig Kaminholz kaufen..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-sm"
            ></textarea>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("tags_label")}</label>
            <div className="flex gap-2 mb-2">
              <input 
                type="text" 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                      setTags([...tags, tagInput.trim()]);
                      setTagInput('');
                    }
                  }
                }}
                placeholder={t("tags_placeholder")} 
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" 
              />
            <button 
              type="button" 
              onClick={() => {
                if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                  setTags([...tags, tagInput.trim()]);
                  setTagInput('');
                }
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition"
            >
              {t('add_tag_btn')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, idx) => (
              <span key={idx} className="bg-white border border-gray-300 px-3 py-1 rounded-full text-sm flex items-center shadow-sm">
                {tag}
                <button 
                  type="button" 
                  onClick={() => setTags(tags.filter((_, i) => i !== idx))} 
                  className="ml-2 text-red-500 hover:text-red-700 font-bold"
                >
                  &times;
                </button>
              </span>
            ))}
            {tags.length === 0 && <p className="text-xs text-gray-500 italic">{t('no_tags_yet')}</p>}
          </div>
        </div>

        {/* Force Sales & Sale Together */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-md border border-gray-200">
          {/* Achat Combiné (Force Sales) */}
          <div className="flex flex-col h-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('force_sales')}</label>
            <p className="text-xs text-gray-500 mb-2">{t('force_sales_desc')}</p>
            <div className="relative mb-2">
              <input 
                type="text" 
                placeholder={t('search_product_id')}
                value={forceSalesSearch}
                onChange={(e) => setForceSalesSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              />
              {forceSalesSearch.trim() !== '' && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto top-full mt-1">
                  {allProducts
                    .filter(p => !forceSalesIds.includes(p.id) && (p.title.toLowerCase().includes(forceSalesSearch.toLowerCase()) || p.id.includes(forceSalesSearch)))
                    .slice(0, 20)
                    .map(prod => (
                      <div 
                        key={prod.id} 
                        onClick={() => {
                          setForceSalesIds([...forceSalesIds, prod.id]);
                          setForceSalesSearch('');
                        }}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-orange-50 cursor-pointer border-b border-gray-100 text-sm transition"
                      >
                        {prod.images?.[0] && <Image width={800} height={800} src={prod.images[0]} alt="" className="w-8 h-8 object-cover rounded border border-gray-100" />}
                        <span className="line-clamp-1 text-gray-800">{prod.title}</span>
                      </div>
                    ))}
                    {allProducts.filter(p => !forceSalesIds.includes(p.id) && (p.title.toLowerCase().includes(forceSalesSearch.toLowerCase()) || p.id.includes(forceSalesSearch))).length === 0 && (
                      <div className="px-3 py-3 text-sm text-gray-500 text-center italic">{t('no_product_found')}</div>
                    )}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-60 pr-1">
              {forceSalesIds.map(id => {
                const prod = allProducts.find(p => p.id === id);
                if (!prod) return null;
                return (
                  <div key={id} className="flex items-center justify-between bg-white border border-orange-200 rounded p-2 text-sm shadow-sm group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {prod.images?.[0] ? (
                        <Image width={800} height={800} src={prod.images[0]} alt="" className="w-10 h-10 object-cover rounded border border-gray-100 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center shrink-0 text-gray-500 text-xs">img</div>
                      )}
                      <span className="line-clamp-2 text-gray-700 font-medium leading-tight">{prod.title}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setForceSalesIds(forceSalesIds.filter(fid => fid !== id))}
                      className="text-red-400 hover:text-red-600 p-2 shrink-0 bg-red-50 hover:bg-red-100 rounded transition opacity-0 group-hover:opacity-100"
                      title={t('remove_item')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                );
              })}
              {forceSalesIds.length === 0 && (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded text-gray-500 text-sm py-6">
                  {t('no_linked_product')}
                </div>
              )}
            </div>
          </div>

          {/* Vendus Ensemble (Sale Together) */}
          <div className="flex flex-col h-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('sale_together')}</label>
            <p className="text-xs text-gray-500 mb-2">{t('sale_together_desc')}</p>
            <div className="relative mb-2">
              <input 
                type="text" 
                placeholder={t('search_product_id')}
                value={saleTogetherSearch}
                onChange={(e) => setSaleTogetherSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              />
              {saleTogetherSearch.trim() !== '' && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto top-full mt-1">
                  {allProducts
                    .filter(p => !saleTogetherIds.includes(p.id) && (p.title.toLowerCase().includes(saleTogetherSearch.toLowerCase()) || p.id.includes(saleTogetherSearch)))
                    .slice(0, 20)
                    .map(prod => (
                      <div 
                        key={prod.id} 
                        onClick={() => {
                          setSaleTogetherIds([...saleTogetherIds, prod.id]);
                          setSaleTogetherSearch('');
                        }}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-orange-50 cursor-pointer border-b border-gray-100 text-sm transition"
                      >
                        {prod.images?.[0] && <Image width={800} height={800} src={prod.images[0]} alt="" className="w-8 h-8 object-cover rounded border border-gray-100" />}
                        <span className="line-clamp-1 text-gray-800">{prod.title}</span>
                      </div>
                    ))}
                    {allProducts.filter(p => !saleTogetherIds.includes(p.id) && (p.title.toLowerCase().includes(saleTogetherSearch.toLowerCase()) || p.id.includes(saleTogetherSearch))).length === 0 && (
                      <div className="px-3 py-3 text-sm text-gray-500 text-center italic">{t('no_product_found')}</div>
                    )}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-60 pr-1">
              {saleTogetherIds.map(id => {
                const prod = allProducts.find(p => p.id === id);
                if (!prod) return null;
                return (
                  <div key={id} className="flex items-center justify-between bg-white border border-gray-200 rounded p-2 text-sm shadow-sm group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {prod.images?.[0] ? (
                        <Image width={800} height={800} src={prod.images[0]} alt="" className="w-10 h-10 object-cover rounded border border-gray-100 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center shrink-0 text-gray-500 text-xs">img</div>
                      )}
                      <span className="line-clamp-2 text-gray-700 font-medium leading-tight">{prod.title}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSaleTogetherIds(saleTogetherIds.filter(fid => fid !== id))}
                      className="text-red-400 hover:text-red-600 p-2 shrink-0 bg-red-50 hover:bg-red-100 rounded transition opacity-0 group-hover:opacity-100"
                      title={t('remove_item')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                );
              })}
              {saleTogetherIds.length === 0 && (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded text-gray-500 text-sm py-6">
                  {t('no_linked_product')}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Flags / Labels */}
        <div className="grid grid-cols-3 gap-6 bg-gray-50 p-4 rounded-md border border-gray-200">
          <div className="flex items-center">
            <input type="checkbox" name="isBestSeller" id="isBestSeller" defaultChecked={initialData?.isBestSeller} className="w-4 h-4 text-orange-700 focus:ring-orange-500 border-gray-300 rounded" />
            <label htmlFor="isBestSeller" className="ml-2 block text-sm text-gray-900">{t('mark_best_seller')}</label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" name="isDealOfTheDay" id="isDealOfTheDay" defaultChecked={initialData?.isDealOfTheDay} className="w-4 h-4 text-orange-700 focus:ring-orange-500 border-gray-300 rounded" />
            <label htmlFor="isDealOfTheDay" className="ml-2 block text-sm text-gray-900">{t('mark_deal_day')}</label>
          </div>
          <div>
            <input type="text" name="discountLabel" defaultValue={initialData?.discountLabel} placeholder={t('discount_label_placeholder')} className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex justify-end">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-medium mr-4 hover:bg-gray-50 transition"
          >
            {t('cancel')}
          </button>
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md font-medium transition disabled:opacity-50"
          >
            {isLoading ? t('saving') : (isEditing ? t('update_product_btn') : t('add_product_btn'))}
          </button>
        </div>

      </form>
    </div>
  );
}
