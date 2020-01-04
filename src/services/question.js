export class Question {
    constructor(graphQLEndpoint, graphQLClient) {
        this.graphQLEndpoint = graphQLEndpoint;
        this.graphQLClient = graphQLClient;
    }

    askQuestion({inquisitorID, classID, questionDescription, videoID}) {
       return this.graphQLClient.query(this.graphQLEndpoint, {
            query: `
mutation createQuestion($inquisitorID: ID!, $classID: ID!, $questionInput: QuestionInput!) {
  createQuestion(inquisitorID: $inquisitorID, classID: $classID, questionInput: $questionInput) {
   id
   inquisitorID
   description
   videoID
  }
}
            `,
            variables: {
                inquisitorID: inquisitorID,
                classID: classID,
                questionInput: {
                    description: questionDescription,
                    videoID: videoID
                }
            }
        });
    }

    answerQuestion({replierID, classID, questionID, answerBody, videoID}) {
        return this.graphQLClient.query(this.graphQLEndpoint, {
            query: `
mutation createAnswer($replierID: ID!, $classID: ID!, $questionID: ID!, $answerInput: AnswerInput!) {
  createAnswer(replierID: $replierID, classID: $classID, questionID: $questionID, answerInput: $answerInput) {
    id
    body
    videoID
    authorID
  }
}
            `,
            variables: {
                replierID: replierID,
                classID: classID,
                questionID: questionID,
                answerInput: {
                    body: answerBody,
                    videoID: videoID
                }
            }
        });
    }
}