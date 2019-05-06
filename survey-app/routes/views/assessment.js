const keystone = require('keystone');

const grabity = require('grabity');

const Module = keystone.list('Module').model;
const Question = keystone.list('Question').model;
const Team = keystone.list('Team').model;
const Answer = keystone.list('Answer').model;

getAssignedModules = async (assignedModules) => {
    return await Module.find({'_id': assignedModules}).sort({'rank': 'asc'});
};

getModuleQuestions = async (moduleId) => {
    return await Question.find({module: moduleId}).sort({'name': 'asc'});
};

getUserAnswers = async (moduleId, userId) => {
    return await Answer.find({
            $and: [
                {moduleId: moduleId},
                {userId: userId}
            ]
        }
    ).sort({'updatedAt': 'desc'});
};

getResourceLinkInfo = async(links) => {
    const results = [];
    for (let i = 0; i < links.length; i++) {
        const details = await grabity.grabIt(links[i]);
        details["link"] = links[i];
        results[i] = details;
    }
    
    return results;
};

exports = module.exports = (req, res) => {
    const view = new keystone.View(req, res);
    
    const locals = res.locals;
    locals.section = 'assessment';
	
    locals.path = "Test";
    locals.active = req.query.surveyIndex || 0;

    view.query('team', Team.findOne({'_id': req.user.team}));

    getAssignedModules(req.user.assignedModules).then((mods) => {
        Promise.all(mods.map(async (mod) => {
            const modId = mod._id;
            const questions = await getModuleQuestions(modId);
            const answers = await getUserAnswers(modId, req.user.id);
            let resources;
            if (mod.resources) {
                resources = await getResourceLinkInfo(mod.resources);
            }
            
            return {
                id: modId,
                name: mod.name,
                questions: questions,
                answers: answers,
                resources: resources
            };
        })).then((modules) => {
            locals.modules = modules;
            view.render('assessment');
        });
    });
};
