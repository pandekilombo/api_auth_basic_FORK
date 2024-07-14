import db from '../dist/db/models/index.js';
import bcrypt from 'bcrypt';
// Importar Sequelize y el operador Op
import { Sequelize, Op } from 'sequelize';

const sequelize = new Sequelize({
    dialect: 'sqlite', // Especifica el dialecto de la base de datos (en este caso, SQLite)
    storage: './database.sqlite', // Ruta donde se almacenará la base de datos SQLite
    // Puedes añadir más opciones aquí según sea necesario
});



// Definir el modelo de usuario
const User = sequelize.define('User', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    cellphone: {
        type: Sequelize.STRING,
        allowNull: false
    },
    createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
    updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
});


const findUsers = async (queryParams) => {
    let whereClause = {
        status: true, // Por defecto, solo usuarios activos
    };
    
    let fechaInicioAntesISO, fechaInicioDespuesISO; // Variables para almacenar las fechas ISO

    // Aplicar filtros según los query parameters
    if (queryParams.status !== undefined) {
        whereClause.status = queryParams.status === 'true' ? true : false;
    }

    if (queryParams.name) {
        whereClause.name = {
            [Op.like]: `%${queryParams.name}%`
        };
    }

    if (queryParams.fechaInicioAntes && typeof queryParams.fechaInicioAntes === 'string') {
        fechaInicioAntesISO = queryParams.fechaInicioAntes.replace(/\//g, '-');
        whereClause.createdAt = {
            [Op.lt]: new Date(fechaInicioAntesISO)
        };
    }

    if (queryParams.fechaInicioDespues && typeof queryParams.fechaInicioDespues === 'string') {
        fechaInicioDespuesISO = queryParams.fechaInicioDespues.replace(/\//g, '-');
        whereClause.createdAt = {
            [Op.gt]: new Date(fechaInicioDespuesISO)
        };
    }

    const users = await db.User.findAll({
        where: whereClause
    });

    return {
        code: 200,
        message: users
    };
}

const bulkCreateUsers = async (usersList) => {
    let successCount = 0;
    let errorCount = 0;
    let errorUsers = [];

    // Verificar que userList sea un array
    if (!Array.isArray(usersList)) {
        throw new Error('La lista de usuarios no es un array válido.');
    }

    // Iterar sobre la lista de usuarios para validar y crear cada uno
    for (let userData of usersList) {
        try {
            // Validar el usuario antes de intentar crearlo (ejemplo de validación básica)
            if (!userData.name || !userData.email || !userData.password) {
                throw new Error('El usuario debe tener nombre, email y contraseña.');
            }
            if (userData.password != userData.password_second){
                throw new Error('Las contraseñas no coinciden');
            }
            // Ejemplo: Crear el usuario en la base de datos (reemplaza con tu lógica real)
            const newUser = await db.User.create({
                name: userData.name,
                password: userData.password,
                status: userData.status !== undefined ? userData.status : true, // Por defecto, activo
                email: userData.email,
                cellphone: userData.cellphone
            });

            // Contar como éxito si se crea el usuario sin errores
            successCount++;
        } catch (error) {
            //contador de errores
            errorCount++;
            errorUsers.push(userData); // Agregar usuario con error a la lista de errores
            
            console.error(`Error al crear usuario ${userData.name}: ${error.message}`);
        }
    }

    // Devolver resultados
    return {
        successCount,
        errorCount,
        errorUsers
    };
}

const createUser = async (req) => {
    const {
        name,
        email,
        password,
        password_second,
        cellphone
    } = req.body;
    if (password !== password_second) {
        return {
            code: 400,
            message: 'Passwords do not match'
        };
    }
    const user = await db.User.findOne({
        where: {
            email: email
        }
    });
    if (user) {
        return {
            code: 400,
            message: 'User already exists'
        };
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.User.create({
        name,
        email,
        password: encryptedPassword,
        cellphone,
        status: true
    });
    return {
        code: 200,
        message: 'User created successfully with ID: ' + newUser.id,
    }
};

const getUserById = async (id) => {
    return {
        code: 200,
        message: await db.User.findOne({
            where: {
                id: id,
                status: true,
            }
        })
    };
}




const getAllUsers = async () => {
    try {
        const users = await db.User.findAll({
            where: {
                status: true // Opcional: puedes filtrar por cualquier otro criterio aquí
            }
        });
        return {
            code: 200,
            message: users
        };
    } catch (error) {
        console.error('Error buscando a los usuarios:', error);
        return {
            code: 500,
            message: 'No se pudo traer los usuarios en la base de datos'
        };
    }
};

const updateUser = async (req) => {
    const user = db.User.findOne({
        where: {
            id: req.params.id,
            status: true,
        }
    });
    const payload = {};
    payload.name = req.body.name ?? user.name;
    payload.password = req.body.password ? await bcrypt.hash(req.body.password, 10) : user.password;
    payload.cellphone = req.body.cellphone ?? user.cellphone;
    await db.User.update(payload, {
        where: {
            id: req.params.id
        }

    });
    return {
        code: 200,
        message: 'User updated successfully'
    };
}

const deleteUser = async (id) => {
    /* await db.User.destroy({
        where: {
            id: id
        }
    }); */
    const user = db.User.findOne({
        where: {
            id: id,
            status: true,
        }
    });
    await  db.User.update({
        status: false
    }, {
        where: {
            id: id
        }
    });
    return {
        code: 200,
        message: 'User deleted successfully'
    };
}

export default {
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    getAllUsers,
    findUsers,
    bulkCreateUsers,
}