export function errorPopup(message = "An error occurred, please try again later.", elementId, confirm=false) {
    if (document.getElementById("errorDiv")) {
        return
    }

    let triggerButton = document.getElementById(elementId)
    
    let errorDiv = document.createElement("div")
    errorDiv.id = "errorDiv"
    errorDiv.classList.add('error-div')
    errorDiv.innerText = message

    if (confirm) {
        let confirmButton = document.createElement("button")
        confirmButton.id = "confirmButton"
        confirmButton.innerText = "Got it!"

        let flex = document.createElement("div")
        flex.style.display = "flex"
        flex.style.flexDirection = "row"
        flex.style.justifyContent = "center"
        flex.id = "errorFlex"
        flex.appendChild(errorDiv)
        flex.appendChild(confirmButton)

        triggerButton.parentElement.insertBefore(flex, triggerButton.nextSibling)
        confirmButton.onclick = function() { document.getElementById("errorFlex").remove() }
    } else {
        triggerButton.parentElement.insertBefore(errorDiv, triggerButton.nextSibling)
        setTimeout(() => {document.getElementById("errorDiv").remove()}, 5000)
    }
}