# FIC (Fast Image Compression)
FIC is a single-pass compression algorithm for compressing images.

## Functions
`compress(data)` where `data` is a `Uint8Array` containing image data in JPEG, PNG, BMP, TIFF, GIF format and returns a Promise containing FIC data.  
`decompress(data)` where `data` is a `Uint8Array` containing FIC data and returns a Promise containing image data in JPEG, PNG, BMP, TIFF, GIF format.

## Important Links
[Documentation](https://i-yam-jeremy.github.io/fast-image-compression)  
[FIC File Format Spec](https://i-yam-jeremy.github.io/fast-image-compression/FIC_File_Format_Specification.pdf)
 
