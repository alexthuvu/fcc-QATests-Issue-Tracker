const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let testId;

suite('Functional Tests', function() {

  suite('POST /api/issues/{project} => object with issue data', function() {
    test('Create an issue with every field', function(done) {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - Every field',
          assigned_to: 'Chai',
          status_text: 'In QA'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, 'Title');
          assert.equal(res.body.issue_text, 'text');
          assert.equal(res.body.created_by, 'Functional Test - Every field');
          assert.equal(res.body.assigned_to, 'Chai');
          assert.equal(res.body.status_text, 'In QA');
          testId = res.body._id;
          done();
        });
    });

    test('Create an issue with only required fields', function(done) {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title 2',
          issue_text: 'text 2',
          created_by: 'Tester'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, 'Title 2');
          assert.equal(res.body.issue_text, 'text 2');
          assert.equal(res.body.created_by, 'Tester');
          done();
        });
    });

    test('Create an issue with missing required fields', function(done) {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'No Text'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'required field(s) missing');
          done();
        });
    });
  });

  suite('GET /api/issues/{project} => Array of objects with issue data', function() {
    test('View issues on a project', function(done) {
      chai.request(server)
        .get('/api/issues/test')
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          done();
        });
    });

    test('View issues on a project with one filter', function(done) {
      chai.request(server)
        .get('/api/issues/test')
        .query({ created_by: 'Tester' })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          res.body.forEach(issue => assert.equal(issue.created_by, 'Tester'));
          done();
        });
    });

    test('View issues on a project with multiple filters', function(done) {
      chai.request(server)
        .get('/api/issues/test')
        .query({ created_by: 'Me', assigned_to: 'You' })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          done();
        });
    });
  });

  suite('PUT /api/issues/{project} => text', function() {
    test('Update one field on an issue', function(done) {
      chai.request(server)
        .put('/api/issues/test')
        .send({ _id: testId, issue_text: 'Updated text' })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.result, 'successfully updated');
          assert.equal(res.body._id, testId);
          done();
        });
    });

    test('Update multiple fields on an issue', function(done) {
      chai.request(server)
        .put('/api/issues/test')
        .send({
          _id: testId,
          issue_text: 'Updated again',
          assigned_to: 'Dev'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.result, 'successfully updated');
          assert.equal(res.body._id, testId);
          done();
        });
    });

    test('Update an issue with missing _id', function(done) {
      chai.request(server)
        .put('/api/issues/test')
        .send({ issue_text: 'Missing ID' })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'missing _id');
          done();
        });
    });

    test('Update an issue with no fields to update', function(done) {
      chai.request(server)
        .put('/api/issues/test')
        .send({ _id: testId })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'no update field(s) sent');
          assert.equal(res.body._id, testId);
          done();
        });
    });

    test('Update an issue with an invalid _id', function(done) {
      chai.request(server)
        .put('/api/issues/test')
        .send({ _id: '123456789012', issue_text: 'Invalid ID' })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'could not update');
          assert.equal(res.body._id, '123456789012');
          done();
        });
    });
  });

  suite('DELETE /api/issues/{project} => text', function() {
    test('Delete an issue', function(done) {
      chai.request(server)
        .delete('/api/issues/test')
        .send({ _id: testId })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.result, 'successfully deleted');
          assert.equal(res.body._id, testId);
          done();
        });
    });

    test('Delete an issue with an invalid _id', function(done) {
      chai.request(server)
        .delete('/api/issues/test')
        .send({ _id: 'invalidid1234567890123456' })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'could not delete');
          assert.equal(res.body._id, 'invalidid1234567890123456');
          done();
        });
    });

    test('Delete an issue with missing _id', function(done) {
      chai.request(server)
        .delete('/api/issues/test')
        .send({ })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'missing _id');
          done();
        });
    });
  });
});