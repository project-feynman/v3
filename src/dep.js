import {HttpClient} from "./httpClient";
import {GraphQLClient} from "./graphqlClient";
import {Question} from "./services/question";

export function initQuestionService() {
    let httpClient = new HttpClient();
    let graphQLClient = new GraphQLClient(httpClient);
    return new Question(graphQLClient);
}