Welcome to tagology - a Semantic Web navigation tool

Mission Statement
***********************
tagology will remain a simple, easy-to-use tool to visualize and interact with Semantic Web data in many different contexts. We hope that it will demonstrate the benefits of Semantic Web technology and thus increase participation in a more peer-to-peer model of internet data.  

	We will stick to the data model principles:
	1. 
	2. 
	3. 

Terminology
************************
DEx: Data Explorer - 3D graph of queried objects that allows for interactive navigation
DOT: DEx Object Target - the current focus object of the DEx
tag::property : data point of DEx objects comprising of type and value
subject::entity::resource
predicate::relationship::type
object::value::target-resource
domain: set of subjects
attributes: set of predicates
range: set of objects
parent object: Has a smaller subset of the DOT's attributes, and all values match
sibling object: Attributes match the DOT's attributes, but values differ
child object: Has a larger set including the DOT's attributes, of which all values match
twin: sibling where all values match also

Code Management
*************************
Version Control: git
Online Repository: git@github.com:shellybelle/tagology.git
Working branch: dev
Master branch: main
Documentation: this (README.txt)

Backend Tech
**********************
Primary Language: python
Framework: Flask
Triplestore: ?

Frontend
*********************
3 UI sections:
Query
- small row, across the top
- SPARQL input w/[Create DEx]
DEx
- rest of screen, under query
- DOT at the center
DOT Display
- 2 sections:
	1. web page view
	2. scrollable list of properties in column on the right
- pop-up over almost the entire screen
- close with [X]

Frontend Tech
*********************
Primary language: javascript
3-D navigation: three.js

Current Features
**********************
Query Wikidata ONLY
- User can enter the SPARQL query and create a DEx for the results
- A few built in queries with pre-federated data for initial navigator and demo purposes
- Retrieves data on wikipedia pages ONLY
- Conservative maxiumum limit of data retrieval
DEx objects are wikipedia pages ONLY
- node label is the page title
Clicking the DOT:
- display webpage
- display list of tags
Navigation shows DOT and 12 top connected objects
- 2 parents
- 4 siblings
- 6 children
[More] refreshes navigation to show next set of 12 top connected objects
- Max of 36 top connected objects (2 refreshes)

Future Features
**********************
User accounts
- users can add properties with a weighted score
- users can add comments on the object
Query any triplestore
Different objects
- objects can be something other than webpages
- will need different ways to display non-webpage objects
Ad revenue
- ads can be connected to DOTs
AI
- Use LLM to create tags on any object
- AI generated tags will have a medium-low weight 
* How a user navigates through a DEx is itself machine learnable!
