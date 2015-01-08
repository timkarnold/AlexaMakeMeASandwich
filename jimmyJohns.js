function orderSandwich() {
	var credentials = {
		Email: "",
		Password: "",
		RememberMe: false
	};

	jjLogin(credentials).then(function(account){
		// load location defaults from customer profile
		var location = {};
		var defaultAddressId = account.Customer.CustomerAddresses.DefaultAddress;
		$.each(account.Customer.CustomerAddresses.Addresses, function(i, address){
			if(address.Index == defaultAddressId) {
				location = address;
			}
		});

		console.log('prepped location', location);

		findClosestStore(location).then(function(stores){
			// autofill default location
			var orderDetails = {
				LocationId: stores.Locations[0].Id,
				OrderType: "Delivery",
				ScheduleTime: "ASAP",
			};

			console.log('prepped orderDetails', orderDetails);

			// contact info
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

			console.log('prepped contactInfo', contactInfo);

			createOrder(orderDetails).then(function(){
				setDeliveryAddress(location).then(function(){
					addFavoriteToOrder(1).then(function(order){
						setDeliverySchedule("2015-01-08+12:00+PM").then(function(){
							var orderItems = order.Order.OrderItems;
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

									console.log('prepped paymentMethod', paymentMethod);
									setPaymentMethod(paymentMethod).then(function(){
										console.info('would submit order now!');
										//submitOrder();
									});
								});
							});
						});
					});
				});
			});
		});
	});
}

function jjLogin(credentials){
	var deferred = Q.defer();
	$.ajax({
		type: "POST",
		url: 'https://online.jimmyjohns.com/api/Customer/LogIn/',
		data: credentials,
		success: function(data) {
			console.warn('jjLogin', data);
			deferred.resolve(data);
		}
	});
	return deferred.promise;
}

function createOrder(details) {
	var deferred = Q.defer();
	$.ajax({
		type: "POST",
		url: 'https://online.jimmyjohns.com/api/Order/',
		data: details,
		success: function(data) {
			console.warn('createOrder', data);
			deferred.resolve();
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
		}
	});
	return deferred.promise;
}

function findClosestStore(location) {
	var deferred = Q.defer();

	$.ajax({
		type: "POST",
		url: 'https://online.jimmyjohns.com/API/Location/ForDeliveryAddress/',
		data: location,
		success: function(data) {
			console.warn('findClosestStore', data);
			deferred.resolve(data);
		}
	});
	return deferred.promise;
}

function setDeliveryAddress(location) {
	var deferred = Q.defer();

	$.ajax({
		type: "PUT",
		url: 'https://online.jimmyjohns.com/api/Order/DeliveryAddress/',
		data: location,
		success: function(data) {
			console.warn('setDeliveryAddress', data);
			deferred.resolve();
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
			console.warn('setContactInfo', data);
			deferred.resolve(data);
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
		}
	});
	return deferred.promise;
}
