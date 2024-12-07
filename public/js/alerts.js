export const hideAlert = () => {
    const elementAlert = document.querySelector('.alert');
    if (elementAlert) {
        elementAlert.parentElement.removeChild(elementAlert);
    }
}

// type: 'success' or 'error'
export const showAlert = (type, msg) => {
    // hide previous alert
    hideAlert();

    const markup = `<div class="alert alert--${type}">${msg}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

    // hide this alert
    window.setTimeout(hideAlert, 3000);
}