const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// list  all existing order data
function list(req, res, next) {
	res.json({ data: orders });
}

// validations to create a new order
function validateDeliverTo(req, res, next) {
	const { data: { deliverTo } = {} } = req.body;
	if (deliverTo !== undefined && deliverTo !== "") {
		res.locals.deliverTo = deliverTo;
		return next();
	}
	next({ status: 400, message: `Order must include a deliverTo` });
}

function validateMobileNumber(req, res, next) {
	const { data: { mobileNumber } = {} } = req.body;
	if (mobileNumber !== undefined && mobileNumber !== "") {
		res.locals.mobileNumber = mobileNumber;
		return next();
	}
	next({ status: 400, message: `Order must include a mobileNumber` });
}

function validateDishes(req, res, next) {
	const { data: { dishes } = {} } = req.body;
	if (dishes === undefined) {
		next({ status: 400, message: `Order must include a dish` });
	}
	if (Array.isArray(dishes) && dishes.length > 0) {
		res.locals.dishes = dishes;
		return next();
	}
	next({ status: 400, message: `Order must inlcude at least one dish` });
}

function validateDishQuantity(req, res, next) {
	const { data: { dishes } = {} } = req.body;

	dishes.forEach((dish, index) => {
		const quantity = dish.quantity;
		if (
			quantity === undefined ||
			quantity <= 0 ||
			typeof quantity !== "number"
		) {
			return next({
				status: 400,
				message: `Dish ${index} must have a quantity that is an innteger greater than 0`,
			});
		}
	});
	return next();
}

// Each dish in the Order's dishes property is a complete copy of the dish, rather than a reference to the dish by id. This is so the order does not change retroactively if the dish data is updated some time after the order is created.

// create a new order
function createOrder(req, res) {
	const { data } = req.body;
	const newOrder = {
		id: nextId(),
		deliverTo: res.locals.deliverTo,
		mobileNumber: res.locals.mobileNumber,
		status: data.status,
		dishes: res.locals.dishes,
	};
	orders.push(newOrder);
	res.status(201).json({ data: newOrder });
}

// check if orderId exists
function orderExists(req, res, next) {
	const orderId = req.params.orderId;
	const foundOrder = orders.find((order) => orderId === order.id);
	if (foundOrder) {
		res.locals.foundOrder = foundOrder;
		return next();
	}
	next({ status: 404, message: `${orderId} does not exist!` });
}

// read function
function read(req, res, next) {
	res.json({ data: res.locals.foundOrder });
}

// update an order

function orderStatusExists(req, res, next) {
	const { data: { status } = {} } = req.body;
	if (status === undefined || status === "") {
		next({
			status: 400,
			message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
		});
	}
	if (status === "delivered") {
		next({
			status: 400,
			message: `A delivered order cannot be changed`,
		});
	}

	if (
		status === "pending" ||
		status === "preparing" ||
		status === "out-for-delivery"
	) {
		res.locals.status = status;
		return next();
	}

	next({
		status: 400,
		message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
	});
}

// id body !== params
function update(req, res, next) {
	const orderId = req.params.orderId;
	const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
		req.body;
	if (id && id !== orderId) {
		next({
			status: 400,
			message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
		});
	}
	const foundOrder = res.locals.foundOrder;
	(foundOrder.deliverTo = deliverTo),
		(foundOrder.mobileNumber = mobileNumber),
		(foundOrder.status = status),
		(foundOrder.dishes = dishes),
		res.json({ data: foundOrder });
}

// validation on status for deletion

function isOrderPending(req, res, next) {
	const foundOrder = res.locals.foundOrder;
	if (foundOrder.status !== "pending") {
		next({
			status: 400,
			message: `An order cannot be deleted unless it is pending`,
		});
	}
	return next();
}

// destroy - delete
function destroy(req, res) {
	const orderId = req.params.orderId;
	const index = orders.findIndex((order) => order.id === orderId);
	if (index > -1) {
		orders.splice(index, 1);
	}
	res.sendStatus(204);
}

module.exports = {
	create: [
		validateDeliverTo,
		validateMobileNumber,
		validateDishes,
		validateDishQuantity,
		createOrder,
	],
	list,
	read: [orderExists, read],
	update: [
		validateDeliverTo,
		validateMobileNumber,
		validateDishes,
		validateDishQuantity,
		orderExists,
		orderStatusExists,
		update,
	],
	delete: [orderExists, isOrderPending, destroy],
};
