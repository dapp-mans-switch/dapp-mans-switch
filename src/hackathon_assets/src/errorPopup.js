export function errorPopup(message = "An error occurred, please try again later.", elementId, confirm=false) {
    if (document.getElementById("errorDiv")) {
        return
    }

    let triggerButton = document.getElementById(elementId)
    
    let flex = document.createElement("div")
    flex.classList.add("error-container")
    flex.id = "errorFlex"

    let errorDiv = document.createElement("div")
    errorDiv.id = "errorDiv"
    errorDiv.classList.add('error-div')
    errorDiv.innerText = message
    flex.appendChild(errorDiv)

    if (confirm) {
        let confirmButton = document.createElement("button")
        confirmButton.id = "confirmButton"
        confirmButton.innerText = "Got it!"
        confirmButton.classList.add('error-confirm-button')

        flex.appendChild(confirmButton)

        triggerButton.parentElement.insertBefore(flex, triggerButton.nextSibling)
        confirmButton.onclick = function() { document.getElementById("errorFlex").remove() }
    } else {
        triggerButton.parentElement.insertBefore(flex, triggerButton.nextSibling)
        setTimeout(() => {document.getElementById("errorDiv").remove()}, 5000)
    }
}