var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var HistorySchema = new Schema({
	term: String,
	when: Date
});

module.exports = mongoose.model('History', HistorySchema);