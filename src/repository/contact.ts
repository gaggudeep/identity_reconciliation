import { DataTypes, Model, ModelIndexesOptions, ModelOptions } from "sequelize";
import sequelize from "../config/sequlelize.js";

const indexes: ModelIndexesOptions[] = [
    {
        unique: true,
        fields: ['email', 'phone_number'],
    }
]

const opts: ModelOptions = {
    indexes: indexes,
}

export enum LinkPrecedence {
    Primary = "primary",
    Secondary = "secondary"
}


export type Contact = {
    id?: number,
    phoneNumber?: string,
    email?: string,
    linkedId?: number,
    linkPrecedence: LinkPrecedence,
    createdAt?: Date
    updatedAt?: Date
    deletedAt?: Date
}


const ContactRepo = sequelize.define<Model<Contact>, Contact>(
    'contact',
    {
        id: {
            type: DataTypes.NUMBER,
            primaryKey: true,
            autoIncrement: true,
        },
        phoneNumber: {
            type: DataTypes.STRING,
            field: "phone_number",
        },
        email: {
            type: DataTypes.STRING,
        },
        linkedId: {
            type: DataTypes.NUMBER,
            field: "linked_id",
        },
        linkPrecedence: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "link_precedence",

        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "created_at",
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "updated_at",
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: "deleted_at",
        },
    },
    opts,
)

try {
    await sequelize.sync()
    console.log('Contact table created succesfully')

} catch (err) {
    console.error('unable to create Contact table: ', err)
    process.exit(1)
}

export default ContactRepo