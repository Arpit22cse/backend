const z=require('zod');
const userSchema = z.object({
    name: z
      .string()
      .min(1, { message: "Name cannot be empty" })
      .max(50, { message: "Name cannot exceed 50 characters" }),
    email: z
      .string()
      .email({ message: "Invalid email address" })
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Eneter a valid Email" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(16, { message: "password length must not be greater than 16"})
      .regex(/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]+$/, { message: "Password must be alphanumeric" }),
  });
function checkParameter(req,res,next){
  const result=userSchema.safeParse(req.body);
  if (result.success) {
    next();// Parsed data
  } else {
    res.status(400).json({msg:result.error.issues[0].message});
  }
}
module.exports=checkParameter;