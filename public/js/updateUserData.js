import axios from "axios";
import { showAlert } from "./alerts";

// type is either 'password' or 'data'
export const updateSettings = async function (userData, type) {
    // Axios is a promise-based HTTP Client for node.js and the browser

    try {
        const usersUrl =
            type === 'password'
                ? 'http://localhost:3000/api/v1/users/update-password'
                : 'http://localhost:3000/api/v1/users/update-me'

        const res = await axios({
            method: 'PATCH',
            url: usersUrl,
            data: userData
        });

        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} updated Successfully!`);

            // reload page; 'true' argument forces a reload from the server
            // location.reload(true);

            // redirect to 'me' page
            location.assign('/me');

        }

    } catch (error) {
        showAlert('error', error.response?.data.message);
    }

}