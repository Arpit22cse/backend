const mongoose=require('mongoose');
const taskSchema=mongoose.Schema({
    title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      completed: {
        type: Boolean,
        default: false,
      },
      dueDate: {
        type: Date,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
})
const Task=mongoose.model('Task',taskSchema);
module.exports=Task;
