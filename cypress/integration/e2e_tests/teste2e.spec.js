describe('Logs in and Visits Tabs', () => {
  it('Visits the app root url', () => {
    cy.visit('/')
    cy.contains('h1', 'ExplainMIT')
    cy.wait(2500)
  })
  
  it('signs out', () => {
    cy.get('[data-qa="account-btn"]').click()
    cy.get('[data-qa="sign-out-btn"]').click()
    cy.wait(1000)
  })

  it('logs in', () => {
    cy.get('[data-qa="log-in-btn"]').click()
    cy.get('[data-qa="email"]').type('explainmit@gmail.com')
    cy.get('[data-qa="password"]').type('explain')
    cy.get('[data-qa="Log in"]').click()
    cy.wait(1000)
  })

  it('enters Integration Testing class', () => {
    cy.get('[data-qa="Integration Testing"]').click()
    cy.wait(1000)
  })

  it('lands tutorial', () => {
    cy.contains("Tutorial")
  })

  it('goes to realtime', () => {
    cy.get('[data-qa="blackboard-tab"]').click()
    cy.wait(1000)
  })

  it("clicks on board 0", () => {
    cy.contains("Blackboard 0").click()
    cy.contains("Record Audio")
    cy.contains("Save Board")
    cy.contains("Full Screen")
    cy.url().should('include', '/class/')
    cy.url().should('include', '/room/')
    cy.wait(1000)
  })

  it("Uses URL to go back to Q&A", () => {
    cy.url().then((url) => { 
      cy.task('cutURL', { original: url, cutStart: 'room'})
      .then( (url) => {
        cy.visit(url)
        cy.wait(1000)
        cy.contains("Tutorial")
      }) 
    })
  })
})

describe("Tests New Post", () => {
  it("clicks New Post", () => {
    cy.contains('New Post').click({force:true})
    cy.wait(1000)
  })

  it("Draws on board", () => {
    cy.get("[data-qa='front-canvas']")
      .trigger('mousedown', {offsetX:200, offsetY:100})
      .trigger('mousemove', {offsetX:600, offsetY:300})
      .trigger('mouseup')

    cy.get("[data-qa='orange']").click()

    cy.get("[data-qa='front-canvas']")
      .trigger('mousedown', {offsetX:600, offsetY:300} )
      .trigger('mousemove', {offsetX:800, offsetY:100})
      .trigger('mousemove', {offsetX:800, offsetY:400})
      .trigger('mouseup')

    cy.get("[data-qa='eraser']").click()

    cy.get("[data-qa='front-canvas']")
      .trigger('mousedown', {offsetX:100, offsetY:200} )
      .trigger('mousemove', {offsetX:800, offsetY:200})
      .trigger('mouseup')

    cy.wait(1000)
  })

  function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  var titleString = makeid(5)

  it("enters title and description", () => {
    cy.get("[data-qa='title-field']").type(titleString)
    cy.get("[data-qa='text-editor']").type("Testing new Post")
    cy.wait(1000)
  })

  it('submits post', () => {
    cy.get( "[data-qa='submit-post-btn']").click()
    cy.wait(1000)
  })

  it('visits new post', () => {
    cy.get( "[data-qa='toggle-drawer']").click()
    cy.contains(titleString).click({force: true})
    cy.wait(1000)
  })

  it('checks post', () => {
    cy.get('[data-qa="create-expl"]')
    cy.get("[data-qa='expl-thumbnail']")
    cy.get("[data-qa='play-btn']").click()
    cy.get("[data-qa='doodle-canvas']")
  })
    
})