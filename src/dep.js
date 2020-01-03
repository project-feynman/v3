import {HttpClient} from "./httpClient";
import {GraphQLClient} from "./graphqlClient";
import {QuestionService} from "./services/question.service";

export function initQuestionService() {
    let httpClient = new HttpClient();
    let graphQLClient = new GraphQLClient(httpClient);
    return new QuestionService(graphQLClient);
}