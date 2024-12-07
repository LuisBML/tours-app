import axios from "axios";
import { showAlert } from "./alerts";


export const bookTour = async (tourId) => {
    try {
        // 1. Get checkout session from our API
        const res = await axios(`http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`);

        // 2. Create checkout form + charge credit card
        if (res.status === 200) {
            // The assign() method of the Location interface causes the window to load and display the document at the URL specified. After the navigation occurs, the user can navigate back to the page that called Location.assign() by pressing the "back" button. - mdn
            location.assign(res.data.session.url);
        }
    } catch (error) {
        console.log(error);
        showAlert('error', 'An error ocurred while processing the payment. Please try again later.');
    }
};