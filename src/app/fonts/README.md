# Critical font subsets

`src/app/critical-fonts.css` declares small, separately cacheable Poppins
400/700 WOFF2 subsets from `public/fonts`. Next.js inlines the declarations into
the initial document, so they do not add a render-blocking stylesheet request.
Poppins is sourced from the Google Fonts
repository at commit `ade3d1533e06b2b1462ffcde8e08b129627ca360`; its OFL is
stored in `OFL-Poppins.txt`.

Nippo is loaded separately through `next/font/local` from the original,
unmodified WOFF2 file. Do not subset, convert, or otherwise modify Nippo without
written permission from Indian Type Foundry; its Fontshare license does not
permit font-software modification by default:
https://www.fontshare.com/licenses/itf-ffl

The Poppins subsets cover printable ASCII, Portuguese diacritics, and the punctuation
used by the public UI. They were generated with FontTools 4.63.0 and Brotli:

```sh
ACE_UNICODES='U+0020-007E,U+00A9-00AA,U+00B7,U+00BA,U+00C0-00C3,U+00C7,U+00C9-00CA,U+00CD,U+00D3-00D5,U+00DA,U+00DC,U+00E0-00E3,U+00E7,U+00E9-00EA,U+00ED,U+00F3-00F5,U+00FA,U+00FC,U+2013-2014,U+2018-201D,U+2022'
uvx --from 'fonttools[woff]==4.63.0' pyftsubset FONT_FILE --unicodes="$ACE_UNICODES" --layout-features='*' --flavor=woff2 --output-file=SUBSET.woff2
base64 -w0 SUBSET.woff2
```

After changing public copy, compare its character set with `ACE_UNICODES`,
regenerate the Poppins subsets when needed, bump the font filenames, then run the
browser and Lighthouse checks.
