import { model, Schema, Types } from "mongoose";
import {
  AsYouType,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from "libphonenumber-js";

type IUser = {
  gameProperty: {
    isJoiningGame: boolean;
    gameUID: Types.ObjectId;
    gameID: string;
  };
  userName: string;
  phoneNumber: string;
  created_at: Date;
};

const User = new Schema<IUser>({
  gameProperty: {
    isJoiningGame: {
      type: Boolean,
      default: false,
    },
    gameUID: {
      type: Schema.Types.ObjectId,
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
      validator: (v: string) => {
        const ast = new AsYouType();
        ast.input(v);

        const formattedOutput = (ast as unknown as { formattedOutput: string })
          .formattedOutput;

        return (
          isPossiblePhoneNumber(formattedOutput, ast.country) &&
          isValidPhoneNumber(formattedOutput, ast.country)
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

export default model<IUser>("User", User);
