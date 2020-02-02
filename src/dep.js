import {HttpClient} from "./httpClient";
import {GraphQLClient} from "./graphqlClient";
import {Question} from "./services/question";
import {Enrollement} from "./services/enrollement"
import {Classes} from "./services/classes"

const GRAPHQL_ENDPOINT = 'https://us-central1-feynman-mvp.cloudfunctions.net/GraphQLAPI';

export function initQuestionService() {
    let httpClient = new HttpClient();
    let graphQLClient = new GraphQLClient(httpClient);
    return new Question(GRAPHQL_ENDPOINT, graphQLClient);
}

export function initEnrollementService(user) {
    return new Enrollement(user)
}

export function encodeKey(key){
    return key.replace(".", "_")
}

export function initClassesService(){
    return new Classes();
}