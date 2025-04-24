const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const mongoose = require('mongoose');
const server = require('../server');
const Issue = require('../models/Issue');
const Project = require('../models/Project');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  this.timeout(5000);

  suiteSetup(async () => {
    try {
      console.log('Connecting to MongoDB with URI:', process.env.MONGO_URI);
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected successfully');
      await Project.deleteMany({});
      await Issue.deleteMany({});
      const project = await Project.create({ name: 'apitest' });
      await Issue.create([
        {
          _id: '5871dda29faedc3491ff93bb',
          issue_title: 'Initial Issue',
          issue_text: 'Initial text',
          created_by: 'Tester',
          projectId: project._id,
        },
        {
          issue_title: 'Test Issue',
          issue_text: 'Test issue for GET',
          created_by: 'Tester',
          assigned_to: 'Joe',
          status_text: 'In Progress',
          open: true,
          projectId: project._id,
        },
      ]);
      console.log('Database seeded successfully');
    } catch (err) {
      console.error('suiteSetup error:', err);
      throw err;
    }
  });

  suiteTeardown(async () => {
    try {
      await Issue.deleteMany({});
      await Project.deleteMany({});
      await mongoose.connection.close();
      console.log('Database cleaned and connection closed');
    } catch (err) {
      console.error('suiteTeardown error:', err);
      throw err;
    }
  });

  test('Create an issue with every field: POST request to /api/issues/{project}', function(done) {
    chai.request(server)
      .post('/api/issues/apitest')
      .send({
        issue_title: 'Test Issue',
        issue_text: 'This is a test issue',
        created_by: 'Tester',
        assigned_to: 'Dev',
        status_text: 'In Progress',
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Test Issue');
        assert.equal(res.body.issue_text, 'This is a test issue');
        assert.equal(res.body.created_by, 'Tester');
        assert.equal(res.body.assigned_to, 'Dev');
        assert.equal(res.body.status_text, 'In Progress');
        assert.property(res.body, '_id');
        assert.property(res.body, 'created_on');
        assert.property(res.body, 'updated_on');
        assert.equal(res.body.open, true);
        done();
      });
  });

  test('Create an issue with only required fields: POST request to /api/issues/{project}', function(done) {
    chai.request(server)
      .post('/api/issues/apitest')
      .send({
        issue_title: 'Test Issue 2',
        issue_text: 'This is another test issue',
        created_by: 'Tester',
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Test Issue 2');
        assert.equal(res.body.issue_text, 'This is another test issue');
        assert.equal(res.body.created_by, 'Tester');
        assert.equal(res.body.assigned_to, '');
        assert.equal(res.body.status_text, '');
        assert.property(res.body, '_id');
        assert.property(res.body, 'created_on');
        assert.property(res.body, 'updated_on');
        assert.equal(res.body.open, true);
        done();
      });
  });

  test('Create an issue with missing required fields: POST request to /api/issues/{project}', function(done) {
    chai.request(server)
      .post('/api/issues/apitest')
      .send({
        issue_text: 'This is a test issue without title',
        created_by: 'Tester',
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, 'required field(s) missing');
        done();
      });
  });

  test('View issues on a project: GET request to /api/issues/{project}', function(done) {
    chai.request(server)
      .get('/api/issues/apitest')
      .query({ open: true, assigned_to: 'Joe' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        if (res.body.length > 0) {
          assert.property(res.body[0], 'issue_title');
          assert.property(res.body[0], 'issue_text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'updated_on');
          assert.property(res.body[0], 'created_by');
          assert.equal(res.body[0].assigned_to, 'Joe');
          assert.property(res.body[0], 'open');
          assert.property(res.body[0], 'status_text');
        }
        done();
      });
  });

  test('View issues on a project with one filter: GET request to /api/issues/{project}', function(done) {
    chai.request(server)
      .get('/api/issues/apitest')
      .query({ open: true })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        if (res.body.length > 0) {
          assert.property(res.body[0], 'issue_title');
          assert.property(res.body[0], 'issue_text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'updated_on');
          assert.property(res.body[0], 'created_by');
          assert.property(res.body[0], 'assigned_to');
          assert.equal(res.body[0].open, true);
          assert.property(res.body[0], 'status_text');
        }
        done();
      });
  });

  test('View issues on a project with multiple filters: GET request to /api/issues/{project}', function(done) {
    chai.request(server)
      .get('/api/issues/apitest')
      .query({ open: true, assigned_to: 'Joe', status_text: 'In Progress' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        if (res.body.length > 0) {
          assert.property(res.body[0], 'issue_title');
          assert.property(res.body[0], 'issue_text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'updated_on');
          assert.property(res.body[0], 'created_by');
          assert.equal(res.body[0].assigned_to, 'Joe');
          assert.equal(res.body[0].open, true);
          assert.equal(res.body[0].status_text, 'In Progress');
        }
        done();
      });
  });

  test('Update one field on an issue: PUT request to /api/issues/{project}', function(done) {
    chai.request(server)
      .put('/api/issues/apitest')
      .send({
        _id: '5871dda29faedc3491ff93bb',
        issue_title: 'Updated Test Issue',
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.result, 'successfully updated');
        assert.equal(res.body._id, '5871dda29faedc3491ff93bb');
        done();
      });
  });

  test('Update multiple fields on an issue: PUT request to /api/issues/{project}', function(done) {
    chai.request(server)
      .put('/api/issues/apitest')
      .send({
        _id: '5871dda29faedc3491ff93bb',
        issue_title: 'Updated Test Issue Again',
        assigned_to: 'New Dev',
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.result, 'successfully updated');
        assert.equal(res.body._id, '5871dda29faedc3491ff93bb');
        done();
      });
  });

  test('Update an issue with missing _id: PUT request to /api/issues/{project}', function(done) {
    chai.request(server)
      .put('/api/issues/apitest')
      .send({
        issue_title: 'Updated Test Issue Again',
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, 'missing _id');
        done();
      });
  });

  test('Update an issue with no fields to update: PUT request to /api/issues/{project}', function(done) {
    chai.request(server)
      .put('/api/issues/apitest')
      .send({
        _id: '5871dda29faedc3491ff93bb',
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, 'no update field(s) sent');
        assert.equal(res.body._id, '5871dda29faedc3491ff93bb');
        done();
      });
  });

  test('Update an issue with an invalid _id: PUT request to /api/issues/{project}', function(done) {
    chai.request(server)
      .put('/api/issues/apitest')
      .send({
        _id: 'invalid_id',
        issue_title: 'Updated Test Issue',
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, 'could not update');
        assert.equal(res.body._id, 'invalid_id');
        done();
      });
  });

  test('Delete an issue: DELETE request to /api/issues/{project}', function(done) {
    chai.request(server)
      .delete('/api/issues/apitest')
      .send({ _id: '5871dda29faedc3491ff93bb' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.result, 'successfully deleted');
        assert.equal(res.body._id, '5871dda29faedc3491ff93bb');
        done();
      });
  });

  test('Delete an issue with an invalid _id: DELETE request to /api/issues/{project}', function(done) {
    chai.request(server)
      .delete('/api/issues/apitest')
      .send({ _id: 'invalid_id' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, 'could not delete');
        assert.equal(res.body._id, 'invalid_id');
        done();
      });
  });

  test('Delete an issue with missing _id: DELETE request to /api/issues/{project}', function(done) {
    chai.request(server)
      .delete('/api/issues/apitest')
      .send({})
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, 'missing _id');
        done();
      });
  });
});