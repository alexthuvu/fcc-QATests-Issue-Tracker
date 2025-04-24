'use strict';

const Issue = require('../models/issue');
const Project = require('../models/project');

module.exports = function (app) {
  app.route('/api/issues/:project')

    .get(async (req, res) => {
      const projectName = req.params.project;
      const query = req.query;

      let project = await Project.findOne({ name: projectName });
      if (!project) {
        project = await Project.create({ name: projectName });
      }

      const filters = { projectId: project._id, ...query };
      const issues = await Issue.find(filters);
      res.json(issues);
    })

    .post(async (req, res) => {
      const { issue_title, issue_text, created_by, assigned_to = '', status_text = '' } = req.body;
      const projectName = req.params.project;

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      let project = await Project.findOne({ name: projectName });
      if (!project) {
        project = await Project.create({ name: projectName });
      }

      const issue = new Issue({
        projectId: project._id,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text
      });

      const saved = await issue.save();
      res.json(saved);
    })

    .put(async (req, res) => {
      const { _id, ...fields } = req.body;

      if (!_id) return res.json({ error: 'missing _id' });

      const updateFields = {};
      for (let key in fields) {
        if (fields[key] !== '') updateFields[key] = fields[key];
      }

      if (Object.keys(updateFields).length === 0) {
        return res.json({ error: 'no update field(s) sent', _id });
      }

      try {
        const updated = await Issue.findByIdAndUpdate(_id, updateFields, { new: true });
        if (!updated) return res.json({ error: 'could not update', _id });
        res.json({ result: 'successfully updated', _id });
      } catch (err) {
        res.json({ error: 'could not update', _id });
      }
    })

    .delete(async (req, res) => {
      const { _id } = req.body;
      if (!_id) return res.json({ error: 'missing _id' });

      try {
        const deleted = await Issue.findByIdAndDelete(_id);
        if (!deleted) return res.json({ error: 'could not delete', _id });
        res.json({ result: 'successfully deleted', _id });
      } catch (err) {
        res.json({ error: 'could not delete', _id });
      }
    });
};
