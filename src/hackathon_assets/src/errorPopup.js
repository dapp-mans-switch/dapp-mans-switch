export function errorPopup(message = "Default Error Message", elementId) {
    let button = document.getElementById(elementId)
    
    let errorDiv = document.createElement("div")
    errorDiv.id = "errorDiv"
    errorDiv.classList.add('error-div')
    errorDiv.innerHTML = message

    button.parentElement.insertBefore(errorDiv, button.nextSibling)

    setTimeout(() => {document.getElementById("errorDiv").remove()}, 5000)
}