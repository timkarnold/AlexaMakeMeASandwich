var JimmyJohns = {};

JimmyJohns.init = function() {
	var deferred = Q.defer();
	console.log("JimmyJohns.init");
	JimmyJohns.loadCredentials().then(function(credentials){
		JimmyJohns.login(credentials).then(function(customerDetails){
			// login success
			JimmyJohns.customerDetails = customerDetails;
			deferred.resolve();
		}, function(){
			// login failed
			deferred.reject();
		});
	}, function(){
		// no saved credentials found
		deferred.reject();
	});
	return deferred.promise;
};

JimmyJohns.loadCredentials = function() {
	var deferred = Q.defer();
	chrome.runtime.sendMessage(chrome.runtime.id, {
	    action: 'get_jj_settings',
	}, function(ret) {
		if (ret.email !== null && ret.pass !== null) {
	    	deferred.resolve(ret);
	    } else {
	    	deferred.reject();
	    }
	});
	return deferred.promise;
};

JimmyJohns.saveCredentials = function(credentials) {
	var deferred = Q.defer();
	chrome.runtime.sendMessage(chrome.runtime.id, {
	    action: 'set_jj_settings',
	    email: credentials.email,
	    pass: credentials.pass
	}, function() {
	    deferred.resolve();
	});
	return deferred.promise;
};

JimmyJohns.login = function(credentials) {
	var deferred = Q.defer();
	$.ajax({
		type: "POST",
		url: 'https://online.jimmyjohns.com/api/Customer/LogIn/',
		data: {
			Email: credentials.email,
			Password: credentials.pass,
			RememberMe: false
		},
		success: function(data) {
			console.log('JimmyJohns.login', data);
			deferred.resolve(data);
		},
		error: function(data) {
			console.error('JimmyJohns.login', data);
			deferred.reject();
		}
	});
	return deferred.promise;
};


JimmyJohns.orderSandwich = function() {
	updateOrderStatus('loading', 'Finding closest store');
	var deliveryLocation = customerDefultDeliveryLocation(JimmyJohns.customerDetails);
	var contactInfo = customerContactInfo(JimmyJohns.customerDetails);
	var scheduleTime = null; //"2015-01-09+12:00+PM";

	JimmyJohns.findClosestStore(deliveryLocation).then(function(store){
		updateOrderStatus('loading', 'Creating order');
		JimmyJohns.createOrder(store, deliveryLocation, contactInfo, scheduleTime).then(function(orderItems){
			updateOrderStatus('loading', 'Checking out');
			JimmyJohns.submitOrder(orderItems, contactInfo).then(function(){
				updateOrderStatus('success', 'Ordered!');
			});
		});
	});
};


JimmyJohns.createOrder = function(store, deliveryLocation, contactInfo, scheduleTime) {
	var deferred = Q.defer();
	var details = {
		LocationId: store.Id,
		OrderType: "Delivery",
		ScheduleTime: "ASAP",
	};

	createOrder(details).then(function(){
		setDeliveryAddress(deliveryLocation).then(function(){
			addFavoriteToOrder(1).then(function(order){
				var orderItems = order.Order.OrderItems;
				if (!scheduleTime) {
					deferred.resolve(orderItems);
				} else {
					setDeliverySchedule(scheduleTime).then(function(){
						deferred.resolve(orderItems);
					}, function(err) {
						console.error("setDeliverySchedule", err);
						deferred.reject("setDeliverySchedule failed");
					});
				}
			}, function(err) {
				console.error("addFavoriteToOrder", err);
				deferred.reject("addFavoriteToOrder failed");
			});
		}, function(err) {
			console.error("setDeliveryAddress", err);
			deferred.reject("setDeliveryAddress failed");
		});
	}, function(err) {
		console.error("createOrder", err);
		deferred.reject("createOrder failed");
	});

	return deferred.promise;
};

JimmyJohns.submitOrder = function(orderItems, contactInfo) {
	var deferred = Q.defer();
	setItemsForCheckout(orderItems).then(function(checkoutOrder){
		setContactInfo(contactInfo).then(function(){
			var paymentMethod = {
				"PaymentCode":"CASH",
				"Amount": checkoutOrder.Order.Balance,
				"CardHolderName":"",
				"CardType":"",
				"CreditCardNumber":"",
				"ExpirationMonth":"",
				"ExpirationYear":"",
				"CvvNumber":"",
				"BillingAddress1":"",
				"BillingAddress2":"",
				"BillingCity":"",
				"BillingState":"",
				"BillingCountry":"",
				"BillingZipcode":"",
				"SaveCreditCardInformation":false,
				"GiftCardNumber":"",
				"GiftCardPinNumber":"",
				"SaveGiftCardInformation":false
			};

			setPaymentMethod(paymentMethod).then(function(){
				console.info('would submit order now!');
				//submitOrder();
				deferred.resolve();
			}, function(err) {
				console.error("setPaymentMethod", err);
				deferred.reject("setPaymentMethod failed");
			});
		}, function(err) {
			console.error("setContactInfo", err);
			deferred.reject("setContactInfo failed");
		});
	}, function(err) {
		console.error("setItemsForCheckout", err);
		deferred.reject("setItemsForCheckout failed");
	});
	return deferred.promise;
};

function createOrder(details){
	var deferred = Q.defer();
	$.ajax({
		type: "POST",
		url: 'https://online.jimmyjohns.com/api/Order/',
		data: details,
		success: function(data) {
			console.warn('createOrder', data);
			deferred.resolve();
		},
		error: function(data) {
			console.error('createOrder', data);
			deferred.reject();
		}
	});
	return deferred.promise;
}

function addFavoriteToOrder(favNum) {
	var deferred = Q.defer();
	$.ajax({
		type: "GET",
		url: 'https://online.jimmyjohns.com/api/Order/AddFavoriteItem/'+favNum,
		success: function(data) {
			console.warn('addFavoriteToOrder', data);
			deferred.resolve(data);
		},
		error: function(data) {
			console.error('addFavoriteToOrder', data);
			deferred.reject();
		}
	});
	return deferred.promise;
}

JimmyJohns.findClosestStore = function(location) {
	var deferred = Q.defer();

	$.ajax({
		type: "POST",
		url: 'https://online.jimmyjohns.com/API/Location/ForDeliveryAddress/',
		data: location,
		success: function(data) {
			console.warn('findClosestStore', data);

			if (data.hasOwnProperty("Locations") && data.Locations.length > 0 && data.Locations[0]) {
				deferred.resolve(data.Locations[0]);
			} else {
				deferred.reject();
			}
		},
		error: function(data) {
			console.error('findClosestStore', data);
			deferred.reject();
		}
	});
	return deferred.promise;
};

function setDeliveryAddress(location) {
	var deferred = Q.defer();

	$.ajax({
		type: "PUT",
		url: 'https://online.jimmyjohns.com/api/Order/DeliveryAddress/',
		data: location,
		success: function(data) {
			console.warn('setDeliveryAddress', data);
			deferred.resolve();
		},
		error: function(data) {
			console.error('setDeliveryAddress', data);
			deferred.reject();
		}
	});
	return deferred.promise;
}

function setPaymentMethod(method) {
	var deferred = Q.defer();

	$.ajax({
		type: "POST",
		url: 'https://online.jimmyjohns.com/api/Payment/Payment/',
		data: method,
		success: function(data) {
			console.warn('setPaymentMethod', data);
			deferred.resolve();
		},
		error: function(data) {
			console.error('setPaymentMethod', data);
			deferred.reject();
		}
	});
	return deferred.promise;
}

function setContactInfo(contactInfo) {
	var deferred = Q.defer();

	$.ajax({
		type: "PUT",
		url: 'https://online.jimmyjohns.com/api/Order/ContactInfo/',
		data: contactInfo,
		success: function(data) {
			console.warn('setContactInfo', data);
			deferred.resolve();
		},
		error: function(data) {
			console.error('setContactInfo', data);
			deferred.reject();
		}
	});
	return deferred.promise;
}

function setItemsForCheckout(items) {
	var deferred = Q.defer();

	$.ajax({
		type: "PUT",
		url: 'https://online.jimmyjohns.com/api/Order/Items/',
		data: items,
		success: function(data) {
			console.warn('setItemsForCheckout', data);
			deferred.resolve(data);
		},
		error: function(data) {
			console.error('setItemsForCheckout', data);
			deferred.reject();
		}
	});
	return deferred.promise;
}

function setDeliverySchedule(time) {
	var deferred = Q.defer();

	$.ajax({
		type: "PUT",
		url: 'https://online.jimmyjohns.com/api/Order/ScheduleTime/?scheduleTime='+time,
		data: time,
		success: function(data) {
			console.warn('setDeliverySchedule', data);
			deferred.resolve();
		},
		error: function(data) {
			console.error('setDeliverySchedule', data);
			deferred.reject();
		}
	});
	return deferred.promise;
}

function submitOrder() {
	var deferred = Q.defer();

	$.ajax({
		type: "GET",
		url: 'https://online.jimmyjohns.com/api/Order/Submit/',
		success: function(data) {
			console.warn('order submitted', data);
			deferred.resolve();
		},
		error: function(data) {
			console.error('submitOrder', data);
			deferred.reject();
		}
	});
	return deferred.promise;
}


function customerDefultDeliveryLocation(account) {
	// load location defaults from customer profile
	var location = {};
	var defaultAddressId = account.Customer.CustomerAddresses.DefaultAddress;
	$.each(account.Customer.CustomerAddresses.Addresses, function(i, address){
		if(address.Index == defaultAddressId) {
			location = address;
		}
	});
	return location;
}

function customerContactInfo(account) {
	var mobilePhone;
	$.each(account.Customer.CustomerInfo, function(i, contact){
		if(contact.Name == "mobilephone") {
			mobilePhone = contact.Value;
		}
	});

	var contactInfo = {
		"ContactFirstName": account.Customer.FirstName,
		"ContactLastName": account.Customer.LastName,
		"ContactEmail": account.Customer.Email,
		"ContactPhone": mobilePhone,
		"OptInNews":false,
		"OptInPromos":false,
		"AcceptedTermsAndConditions":true,
		"IsAnonymousUser":false
	};

	return contactInfo;
}
