'use strict';
require('dotenv').config();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

const modelIssue = require(process.cwd() + '/models/Issue.js');
const modelProject = require(process.cwd() + '/models/Project.js');

module.exports = function (app) {
  // Parse form data and JSON for this route
  app.use('/api/issues', bodyParser.urlencoded({ extended: true }));
  app.use('/api/issues', bodyParser.json());

  app.route('/api/issues/:project')
    .get(async (req, res) => {
      try {
        const projectName = req.params.project;
        const project = await modelProject.findOne({ name: projectName });

        if (!project) {
          return res.status(200).json([]); // Return empty array if no project
        }
        const filter = { projectId: project._id };

        if (req.query._id) filter._id = req.query._id;
        if (req.query.open !== undefined) filter.open = req.query.open === 'true';
        if (req.query.created_on) filter.created_on = new Date(req.query.created_on);
        if (req.query.updated_on) filter.updated_on = new Date(req.query.updated_on);
        if (req.query.issue_title) filter.issue_title = req.query.issue_title;
        if (req.query.issue_text) filter.issue_text = req.query.issue_text;
        if (req.query.created_by) filter.created_by = req.query.created_by;
        if (req.query.assigned_to) filter.assigned_to = req.query.assigned_to;
        if (req.query.status_text) filter.status_text = req.query.status_text;

        const issues = await modelIssue.find(filter);
        res.status(200).json(issues);
      } catch (err) {
        console.error('GET error:', err);
        res.status(200).json([]); // Return empty array on error
      }
    })
    .post(async (req, res) => {
      const projectName = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      // Log request body for debugging
      console.log('POST request body:', req.body);

      if (!issue_title || !issue_text || !created_by) {
        return res.status(200).json({ error: 'required field(s) missing' });
      }

      try {
        let project = await modelProject.findOne({ name: projectName });
        if (!project) {
          project = new modelProject({ name: projectName });
          await project.save();
        }

        const issue = new modelIssue({
          issue_title,
          issue_text,
          created_by,
          assigned_to: assigned_to || '',
          status_text: status_text || '',
          projectId: project._id,
          created_on: new Date(),
          updated_on: new Date(),
          open: true,
        });

        const savedIssue = await issue.save();
        res.status(200).json({
          _id: savedIssue._id,
          issue_title: savedIssue.issue_title,
          issue_text: savedIssue.issue_text,
          created_by: savedIssue.created_by,
          assigned_to: savedIssue.assigned_to || '',
          status_text: savedIssue.status_text || '',
          created_on: savedIssue.created_on,
          updated_on: savedIssue.updated_on,
          open: savedIssue.open,
        });
      } catch (err) {
        console.error('POST error:', err);
        res.status(200).json({ error: 'could not create issue' });
      }
    })
    .put(async (req, res) => {
      const projectName = req.params.project;
      const { _id, issue_title, issue_text, created_by, assigned_to, status_text, open } = req.body;

      // Log request body for debugging
      console.log('PUT request body:', req.body);

      if (!_id) {
        return res.status(200).json({ error: 'missing _id' });
      }

      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(200).json({ error: 'could not update', _id });
      }

      const updateFields = {};
      if (issue_title) updateFields.issue_title = issue_title;
      if (issue_text) updateFields.issue_text = issue_text;
      if (created_by) updateFields.created_by = created_by;
      if (assigned_to) updateFields.assigned_to = assigned_to;
      if (status_text) updateFields.status_text = status_text;
      if (open !== undefined && open !== null) updateFields.open = open;

      if (Object.keys(updateFields).length === 0) {
        return res.status(200).json({ error: 'no update field(s) sent', _id });
      }

      try {
        let project = await modelProject.findOne({ name: projectName });
        if (!project) {
          return res.status(200).json({ error: 'could not update', _id });
        }

        const issue = await modelIssue.findOneAndUpdate(
          { _id, projectId: project._id },
          { ...updateFields, updated_on: new Date() },
          { new: true }
        );
        if (!issue) {
          return res.status(200).json({ error: 'could not update', _id });
        }

        res.status(200).json({ result: 'successfully updated', _id });
      } catch (err) {
        console.error('PUT error:', err);
        res.status(200).json({ error: 'could not update', _id });
      }
    })
    .delete(async (req, res) => {
      const projectName = req.params.project;
      const { _id } = req.body;

      // Log request body for debugging
      console.log('DELETE request body:', req.body);

      if (!_id) {
        return res.status(200).json({ error: 'missing _id' });
      }

      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(200).json({ error: 'could not delete', _id });
      }

      try {
        let project = await modelProject.findOne({ name: projectName });
        if (!project) {
          return res.status(200).json({ error: 'could not delete', _id });
        }

        const issue = await modelIssue.findOneAndDelete({ _id, projectId: project._id });
        if (!issue) {
          return res.status(200).json({ error: 'could not delete', _id });
        }

        res.status(200).json({ result: 'successfully deleted', _id });
      } catch (err) {
        console.error('DELETE error:', err);
        res.status(200).json({ error: 'could not delete', _id });
      }
    });
};