'use client';

const COLOR_REGEX = /^#[0-9a-fA-F]{3,8}$|^rgba?\([0-9, .%]+\)$|^hsl\([0-9, .%]+\)$/;

export default function ThemeProvider({ themeColor }: { themeColor: string }) {
  if (!themeColor || !COLOR_REGEX.test(themeColor.trim())) return null;

  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        :root {
          --theme-primary: ${themeColor.trim()};
        }
      `
    }} />
  );
}
