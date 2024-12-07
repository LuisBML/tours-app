import axios from "axios";
import { showAlert } from "./alerts";

export const register = async function (name, email, password, passwordConfirm) {
    // Axios is a promise-based HTTP Client for node.js and the browser

    try {
        const res = await axios({
            method: 'POST',
            url: 'http://localhost:3000/api/v1/users/signup',
            data: {
                name: name,
                email: email,
                password: password,
                passwordConfirm: passwordConfirm
            }
        });

        // If everything went well, the API generates a token that will be save on the browser in a cookie.
        // The browser will send that cookie with every request (and we may use it for authorization purposes).

        if (res.data.status === 'success') {
            showAlert('success', 'Logged in Successfully!');

            window.setTimeout(() => {
                // redirect to homepage after 1 second
                location.assign('/');
            }, 1000);
        }

    } catch (error) {
        showAlert('error', error.response?.data.message);
    }

}