export class HttpClient {
    postJSON(url, jsonBody) {
        return fetch(url, {
            method: 'post',
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify(jsonBody)
        })
            .then((response) => response.json());
    }
}