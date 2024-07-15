import db from '../dist/db/models/index.js';
import bcrypt from 'bcrypt';
// Importar Sequelize y el operador Op
import { Sequelize, Op } from 'sequelize';

const sequelize = new Sequelize({
    dialect: 'sqlite', // Especifica el dialecto de la base de datos (en este caso, SQLite)
    storage: './database.sqlite', // Ruta donde se almacenará la base de datos SQLite
    // Puedes añadir más opciones aquí según sea necesario
});


//nota: si ayude gente a hacer esto, pero lo mio lo comente por que entendi mi propio codigo,
//despues no me pida hacer esto desde 0 por que me falta experiencia con js :S


// Definicion de los usuarios ingresados //no esta en uso pero no quise eliminarlo
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

//Buscador de usuarios con filtros segun:
//name: string - > busca similares
//status: true o false
//fechaInicioAntes - > es decir, usuarios con fecha de creacion anterior a la indicada
//fechaInicioDespues - > es decir, usuarios con fecha de creacion posterior a la indicada
const findUsers = async (queryParams) => {
    let whereClause = {
        status: true, // Por defecto, solo usuarios activos por si acaso
    };
    
    let fechaInicioAntesISO, fechaInicioDespuesISO; // Variables para almacenar las fechas ISO

    // Aplicar filtros según los query parameters
    if (queryParams.status !== undefined) {

        //filtra segun lo ingresado en status como query
        whereClause.status = queryParams.status === 'true' ? true : false;
    }

    if (queryParams.name) {
        //filtra si se ingreso un query de name
        whereClause.name = {
            [Op.like]: `%${queryParams.name}%`
        };
    }

    //Arregla el formato de la fecha en caso de no usar guiones para luego filtrar
    if (queryParams.fechaInicioAntes && typeof queryParams.fechaInicioAntes === 'string') {
        fechaInicioAntesISO = queryParams.fechaInicioAntes.replace(/\//g, '-');
        whereClause.createdAt = {
            [Op.lt]: new Date(fechaInicioAntesISO)
        };
    }

    //Lo mismo que la anterior pero para fechainiciodespues para luego filtrar
    if (queryParams.fechaInicioDespues && typeof queryParams.fechaInicioDespues === 'string') {
        fechaInicioDespuesISO = queryParams.fechaInicioDespues.replace(/\//g, '-');
        whereClause.createdAt = {
            [Op.gt]: new Date(fechaInicioDespuesISO)
        };
    }

    //En caso de no haber usado ningun filtro whereclause indica buscar a todos
    const users = await db.User.findAll({
        where: whereClause
    });

    //retorna los usuarios encontrados
    return {
        code: 200,
        message: users
    };
}

//Crear de golpe varios usuarios enlistado
const bulkCreateUsers = async (usersList) => {
    //Contador de usuarios creados
    let successCount = 0;

    //Contador errores al crear usuarios
    let errorCount = 0;

    //Lista con los usuarios que no se pudieron agregar
    let errorUsers = [];

    // Verificar que la lista a registrar sea un array
    if (!Array.isArray(usersList)) {
        throw new Error('La lista de usuarios no es un array válido.');
    }

    // Iterar sobre la lista de usuarios para validar y crear cada uno
    for (let userData of usersList) {
        try {
            // Validar el usuario antes de intentar crearlo 
            if (!userData.name || !userData.email || !userData.password) {
                throw new Error('El usuario debe tener nombre, email y contraseña.');
            }
            
            // Validar que la cofirmacion de contraseña sea valida
            if (userData.password != userData.password_second){
                throw new Error('Las contraseñas no coinciden');
            }

            //Verificar que existe ya un usuario con ese correo 
            const user = await db.User.findOne({
                where: {
                    email: userData.email
                }
            });
            if (user) {
                throw new Error('Ya hay un usuario con ese correo');

            }

            //Crear usuario
            const newUser = await db.User.create({
                name: userData.name,
                password: userData.password,
                status: userData.status !== undefined ? userData.status : true, // Por defecto, activo
                email: userData.email,
                cellphone: userData.cellphone
            });

            // Contar como exito si se crea el usuario sin errores
            successCount++;
        } catch (error) {

            //En caso de entrar a error se suma al contdor de errores 
            errorCount++;

            // Agregar usuario con error a la lista de errores
            errorUsers.push(userData); 
            
            //Imprimir en consola que el usuario actual no pudo ser agregado
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



// Busca a todos los usuarios
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