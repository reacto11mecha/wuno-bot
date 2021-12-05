import mongoose from "mongoose";
import parsePhoneNumber from "libphonenumber-js";

const { AsYouType, isPossiblePhoneNumber, isValidPhoneNumber } =
  parsePhoneNumber;

const User = new mongoose.Schema({
  gameProperty: {
    isJoiningGame: {
      type: Boolean,
      default: false,
    },
    gameUID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
    },
    gameID: {
      type: String,
      ref: "Game.gameID",
    },
  },
  userName: {
    type: String,
    default: "",
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v) => {
        const ast = new AsYouType();
        ast.input(v);

        return (
          isPossiblePhoneNumber(ast.formattedOutput, ast.country) &&
          isValidPhoneNumber(ast.formattedOutput, ast.country)
        );
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("User", User);
