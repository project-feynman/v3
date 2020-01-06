export class GraphQLClient {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }

    query(graphQLEndpoint, graphQLQuery) {
        return new Promise((resolve, reject) => {
            this.httpClient
                .postJSON(graphQLEndpoint, graphQLQuery)
                .then(res => {
                    if (res.errors) {
                        reject(res.errors);
                        return;
                    }
                    resolve(res.data);
                })

        });
    }
}