# Transparent Videos in Different Browsers

1) In blender: export as webm (with transparency): gives support for Firefox and Chromium

2) Extract images with `ffmpeg`:
`ffmpeg -vcodec libvpx-vp9 -i key-flip.webm -pix_fmt rgba frames_keyflip/%04d.png`

3) In Adobe Premiere Pro, go to Import (on options choose "Image Sequence", make sure all images are in one folder and select the first image)
(https://www.youtube.com/watch?v=LJFsndPKvFQ)

4) Then export as QuickTime Apple ProRes 4444 XQ, deselect "Export Audio" (produces a .mov file)

5) Activate on macOS keyboard preferences > shortcuts > services > Encode Selected Video Files
(https://larryjordan.com/articles/include-transparency-alpha-channels-in-hevc-video/)

6) Right click on video and export HEVC 1080p and check "Preserve Transparency" to reduce file size

7) Test video here https://rotato.app/tools/transparent-video
