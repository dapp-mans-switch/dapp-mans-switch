import loadingVideoMov from './../assets/loading.mov'
import loadingVideoWebm from './../assets/loading.webm'

// elementId: looking for first parent who is a div and append video element
// position: true = top and false = bottom (string)
// function appendLoadingAnimation(elementId, position) {
//   let loadAnim = document.createElement('video')
//   loadAnim.id = "loadAnimation"
export function appendLoadingAnimation(elementId, position) {
        let loadAnim = document.createElement('video')
        loadAnim.id = "loadAnimation"

        loadAnim.classList.add('loading-video')
        if (position) {
          loadAnim.classList.add('loading-video-top')
        } else {
          loadAnim.classList.add('loading-video-bottom')
        }

        let animSourceMov = document.createElement('source')
        let animSourceWebm = document.createElement('source')
        animSourceMov.setAttribute('src', loadingVideoMov)
        animSourceWebm.setAttribute('src', loadingVideoWebm)
        loadAnim.appendChild(animSourceMov)
        loadAnim.appendChild(animSourceWebm)

        document.getElementById(elementId).closest("div").appendChild(loadAnim)
        loadAnim.autoplay = true
        loadAnim.muted = true
        loadAnim.loop = true
    }

export function removeLoadingAnimation() {
    document.getElementById("loadAnimation").remove()
}
