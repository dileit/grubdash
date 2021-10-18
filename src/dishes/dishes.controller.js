const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// validate dish name

function validateDishName(req, res, next) {
	const { data: { name } = {} } = req.body;
	if (name !== undefined && name !== "") {
		res.locals.name = name;
		return next();
	}
	next({ status: 400, message: `This is not a valid dish name!` });
}

// validate dish description
function validateDishDesc(req, res, next) {
	const { data: { description } = {} } = req.body;
	if (description !== undefined && description !== "") {
		res.locals.description = description;
		return next();
	}
	next({ status: 400, message: `This is not a valid dish description!` });
}

// validate dish price
function validateDishPrice(req, res, next) {
	const { data: { price } = {} } = req.body;
	if (price !== undefined && Number(price) > 0) {
		res.locals.price = price;
		return next();
	}
	next({ status: 400, message: `This is not a valid dish price!` });
}

// validate image_url
function validateURL(req, res, next) {
	const { data: { image_url } = {} } = req.body;
	if (image_url !== undefined && image_url !== "") {
		res.locals.image_url = image_url;
		return next();
	}
	next({ status: 400, message: `This is not a valid image_url!` });
}

// create the dish
function create(req, res) {
	const newDish = {
		id: nextId(),
		name: res.locals.name,
		description: res.locals.description,
		price: res.locals.price,
		image_url: res.locals.image_url,
	};
	dishes.push(newDish);
	res.status(201).json({ data: newDish });
}

function list(req, res) {
	res.json({ data: dishes });
}

// validate that dishID exists
function dishIdExists(req, res, next) {
	const dishId = req.params.dishId;
	const foundDish = dishes.find((dish) => dishId === dish.id);
	if (foundDish) {
		res.locals.foundDish = foundDish;
		return next();
	}
	next({ status: 404, message: `${dishId} does not exist!` });
}

// read dish
function read(req, res) {
	res.json({ data: res.locals.foundDish });
}

function update(req, res, next) {
	const dishId = req.params.dishId;
	const { data: { id, name, description, price, image_url } = {} } = req.body;
	if (id && id !== dishId) {
		next({
			status: 400,
			message: `Dish id does not match route id. Dish:${id}, Route ${dishId}`,
		});
	}
	if (typeof price !== "number") {
		next({
			status: 400,
			message: `price`,
		});
	}

	const foundDish = res.locals.foundDish;
	foundDish.name = name;
	foundDish.description = description;
	foundDish.price = price;
	foundDish.image_url = image_url;
	res.json({ data: foundDish });
}

module.exports = {
	create: [
		validateDishName,
		validateDishDesc,
		validateDishPrice,
		validateURL,
		create,
	],
	list,
	read: [dishIdExists, read],
	update: [
		dishIdExists,
		validateDishName,
		validateDishDesc,
		validateDishPrice,
		validateURL,
		update,
	],
};
