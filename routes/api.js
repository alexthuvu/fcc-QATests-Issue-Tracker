'use strict';
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Issue   = require(process.cwd() + '/models/Issue.js');
const Project = require(process.cwd() + '/models/Project.js');

module.exports = function (app) {
  // first parse form data, then JSON, for every /api/issues/* request
  app.use('/api/issues', bodyParser.urlencoded({ extended: true }));
  app.use('/api/issues', bodyParser.json());

  // DEBUG: log every incoming request to /api/issues/*
  app.use('/api/issues/:project', (req, res, next) => {
  console.log(`\n----\n${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);
  next();
});

  app.route('/api/issues/:project')

    // CREATE
    .post(async (req, res) => {
      const projectName = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      try {
        let proj = await Project.findOne({ name: projectName });
        if (!proj) proj = await Project.create({ name: projectName });

        const issue = await Issue.create({
          issue_title,
          issue_text,
          created_by,
          assigned_to: assigned_to || '',
          status_text: status_text || '',
          projectId: proj._id
        });

        return res.json({
          _id:         issue._id,
          issue_title: issue.issue_title,
          issue_text:  issue.issue_text,
          created_by:  issue.created_by,
          assigned_to: issue.assigned_to,
          status_text: issue.status_text,
          created_on:  issue.created_on,
          updated_on:  issue.updated_on,
          open:        issue.open
        });
      } catch (err) {
        console.error('POST error:', err);
        return res.json({ error: 'could not create issue' });
      }
    })

    // READ
    .get(async (req, res) => {
      const projectName = req.params.project;
      const query = req.query;
      const filter = {};

      try {
        const proj = await Project.findOne({ name: projectName });
        if (!proj) return res.json([]);

        filter.projectId = proj._id;

        Object.entries(query).forEach(([k, v]) => {
          if (['_id','issue_title','issue_text','created_by','assigned_to','status_text'].includes(k)) {
            filter[k] = v;
          } else if (k === 'open') {
            filter.open = v === 'true';
          } else if (k === 'created_on' || k === 'updated_on') {
            filter[k] = new Date(v);
          }
        });

        const issues = await Issue.find(filter);
        return res.json(issues);
      } catch (err) {
        console.error('GET error:', err);
        return res.json([]);
      }
    })

    // UPDATE
    .put(async (req, res) => {
      const projectName = req.params.project;
      const { _id, issue_title, issue_text, created_by, assigned_to, status_text, open } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.json({ error: 'could not update', _id });
      }

      const updateFields = {};
      if (issue_title)  updateFields.issue_title  = issue_title;
      if (issue_text)   updateFields.issue_text   = issue_text;
      if (created_by)   updateFields.created_by   = created_by;
      if (assigned_to)  updateFields.assigned_to  = assigned_to;
      if (status_text)  updateFields.status_text  = status_text;
      if (open !== undefined) updateFields.open = open;

      if (Object.keys(updateFields).length === 0) {
        return res.json({ error: 'no update field(s) sent', _id });
      }

      try {
        const proj = await Project.findOne({ name: projectName });
        if (!proj) {
          return res.json({ error: 'could not update', _id });
        }

        const updated = await Issue.findOneAndUpdate(
          { _id, projectId: proj._id },
          { ...updateFields, updated_on: new Date() },
          { new: true }
        );
        if (!updated) {
          return res.json({ error: 'could not update', _id });
        }

        return res.json({ result: 'successfully updated', _id });
      } catch (err) {
        console.error('PUT error:', err);
        return res.json({ error: 'could not update', _id });
      }
    })

    // DELETE
    .delete(async (req, res) => {
      const projectName = req.params.project;
      const { _id } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.json({ error: 'could not delete', _id });
      }

      try {
        const proj = await Project.findOne({ name: projectName });
        if (!proj) {
          return res.json({ error: 'could not delete', _id });
        }

        const deleted = await Issue.findOneAndDelete({ _id, projectId: proj._id });
        if (!deleted) {
          return res.json({ error: 'could not delete', _id });
        }

        return res.json({ result: 'successfully deleted', _id });
      } catch (err) {
        console.error('DELETE error:', err);
        return res.json({ error: 'could not delete', _id });
      }
    });
};
