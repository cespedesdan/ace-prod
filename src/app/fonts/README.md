# Critical font subsets

`public/critical-fonts-v1.css` embeds small WOFF2 subsets of Poppins 400/700 and
Nippo 700 so the branded first paint needs one cacheable stylesheet instead of
three font requests. The original Nippo file remains in this directory. Poppins is sourced from the Google Fonts
repository at commit `ade3d1533e06b2b1462ffcde8e08b129627ca360`; its OFL is
stored in `OFL-Poppins.txt`.

The subsets cover printable ASCII, Portuguese diacritics, and the punctuation
used by the public UI. They were generated with FontTools 4.63.0 and Brotli:

```sh
ACE_UNICODES='U+0020-007E,U+00A9-00AA,U+00B7,U+00BA,U+00C0-00C3,U+00C7,U+00C9-00CA,U+00CD,U+00D3-00D5,U+00DA,U+00DC,U+00E0-00E3,U+00E7,U+00E9-00EA,U+00ED,U+00F3-00F5,U+00FA,U+00FC,U+2013-2014,U+2018-201D,U+2022'
uvx --from 'fonttools[woff]==4.63.0' pyftsubset FONT_FILE --unicodes="$ACE_UNICODES" --layout-features='*' --flavor=woff2 --output-file=SUBSET.woff2
base64 -w0 SUBSET.woff2
```

After changing public copy, compare its character set with `ACE_UNICODES`,
regenerate the subsets when needed, bump the stylesheet filename, then run the
browser and Lighthouse checks.
