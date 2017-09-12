var mongoose = require ("mongoose");

// Create the Schema class
var Schema = mongoose.Schema;
var StorySchema = new Schema({
    title: {
        type: String, 
        required: true
    },
    saved: {
        type: Boolean,
        default: false
    },
    image: {
        type: String,
        required: true
    },
    note: {
        type: Schema.Types.ObjectId,
        re: "Note"
    },
    link: {
        type: String,
        required: true
    }
});

var Story = mongoose.model("Story", StorySchema);
module.exports = Story