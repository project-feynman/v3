import {HttpClient} from "./httpClient";
import {GraphQLClient} from "./graphqlClient";
import {Question} from "./services/question";

const GRAPHQL_ENDPOINT = 'https://us-central1-feynman-mvp.cloudfunctions.net/GraphQLAPI';

export function initQuestionService() {
    let httpClient = new HttpClient();
    let graphQLClient = new GraphQLClient(httpClient);
    return new Question(GRAPHQL_ENDPOINT, graphQLClient);
}