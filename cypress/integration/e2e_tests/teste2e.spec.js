describe('Explain Run Through', () => {
    it('Visits the app root url', () => {
      cy.visit('/')
      cy.contains('h1', 'ExplainMIT')
      cy.wait(2500)
    })
    
    it('signs out', () => {
      cy.get('#account-btn').click()
      cy.get('#sign-out-btn').click()
      cy.wait(1000)
    })

    it('logs in', () => {
      cy.get('#log-in-btn').click()
      cy.get('[type="email"]').type('explainmit@gmail.com')
      cy.get('[type="password"]').type('explain')
      cy.get('[id="Log in"]').click()
      cy.wait(1000)
    })

    it('enters Dev Testing class', () => {
      cy.get('[id="Dev Testing"]').click()
      cy.wait(1000)
    })

    it('lands tutorial', () => {
      cy.contains("Tutorial")
    })

    it('goes to realtime', () => {
      cy.get('#blackboard-tab').click()
      cy.wait(1000)
    })

    it("clicks on board 0", () => {
      cy.contains("Blackboard 0").click()
    })
  })