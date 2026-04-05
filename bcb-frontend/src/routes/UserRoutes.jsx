import React from 'react';
import { Route } from 'react-router-dom';

import ProtectedRoute from '../components/routes/ProtectedRoute';
import RoleBasedRoute from '../components/routes/RoleBasedRoute';

import HomePage from '../pages/user/HomePage';
import ContactPage from '../pages/user/ContactPage';
import BadmintonBranchsPage from '../pages/user/BadmintonBranchsPage';
import ProfilePage from '../pages/user/ProfilePage';
import RequestSentsSuccessfullyPage from '../pages/user/RequestSentsSuccessfullyPage';
import BranchDetailPage from '../pages/user/BranchDetailPage';
import CheckoutPage from '../pages/user/CheckoutPage';
import BookingSuccessfullyPage from '../pages/user/BookingSuccessfullyPage';
import TransientPage from '../pages/user/TransientPage';
import TemporaryRecruitmentDetailSharePage from '../pages/user/TemporaryRecruitment/TemporaryRecruitmentDetailSharePage';
import TemporaryRecruitment from '../pages/user/TemporaryRecruitment';
import CheckoutFixedPage from '../pages/user/CheckoutFixedPage';
import PaymentResult from '../pages/user/PaymentResult';
import DemoPaymentPage from '../pages/user/DemoPaymentPage';

const withUserProtection = (Component) => (
	<ProtectedRoute>
		<RoleBasedRoute role="USER">
			<Component />
		</RoleBasedRoute>
	</ProtectedRoute>
);

const userRoutes = [
	<Route key="home" path="/" element={<HomePage />} />,
	<Route key="contact" path="/contact" element={<ContactPage />} />,
	<Route
		key="request-sents-successfully"
		path="/contact/request-sents-successfully"
		element={<RequestSentsSuccessfullyPage />}
	/>,
	<Route
		key="badminton-branch"
		path="/badminton-branchs"
		element={<BadmintonBranchsPage />}
	/>,
	<Route
		key="branch-detail"
		path="/branch-detail/:branchId"
		element={<BranchDetailPage />}
	/>,
	<Route
		key="temporary-recruitment"
		path="/temporary-recruitment"
		element={<TemporaryRecruitment />}
	/>,
	<Route
		key="/share-temporary-recruitment"
		path="/share/temporary-recruitment/:temporaryRecruitmentId"
		element={<TemporaryRecruitmentDetailSharePage />}
	/>,
	<Route
		key="transients"
		path="/transients"
		element={<TransientPage />}
	/>,
	<Route
		key="checkout"
		path="/checkout"
		element={withUserProtection(CheckoutPage)}
	/>,
	<Route
		key="booking-successfully"
		path="/booking-successfully"
		element={withUserProtection(BookingSuccessfullyPage)}
	/>,
	<Route
		key="payment-result"
		path="/payment-result"
		element={<PaymentResult/>}
	/>,
	<Route
		key="demo-payment"
		path="/demo-payment"
		element={withUserProtection(DemoPaymentPage)}
	/>,
	<Route
		key="checkout-fixed"
		path="/checkout-fixed"
		element={withUserProtection(CheckoutFixedPage)}
	/>,
	<Route
		key="profile"
		path="/profile"
		element={withUserProtection(ProfilePage)}
	/>,
];

export default userRoutes;
