import loadingVideo from './../assets/loading.mkv'

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
    
        let animSource = document.createElement('source')
        animSource.setAttribute('src', loadingVideo)
    
        loadAnim.appendChild(animSource)
    
        document.getElementById(elementId).closest("div").appendChild(loadAnim)
        loadAnim.autoplay = true
        loadAnim.muted = true
        loadAnim.loop = true
    }

export function removeLoadingAnimation() {
    document.getElementById("loadAnimation").remove()
}