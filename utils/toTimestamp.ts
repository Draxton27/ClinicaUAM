import firebase from "../firebase/clientApp";

export const toTimestamp = (date: Date): firebase.firestore.Timestamp => {
    return firebase.firestore.Timestamp.fromDate(date);
};