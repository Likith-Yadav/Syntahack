import { ConnectButton, useActiveAccount, useDisconnect } from "thirdweb/react";
import { motion, useScroll, useTransform } from "framer-motion";
import { client } from "./client";
import { ArrowDownIcon, SparklesIcon, ShieldCheckIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Aurora from "./components/Aurora";
import Squares from "./components/Squares";
import Orb from "./components/Orb";
import DecryptedText from "./components/DecryptedText";
import GradientText from "./components/GradientText";
import RoleSelectionModal from "./components/RoleSelectionModal";
import InstitutionDashboard from "./pages/InstitutionDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TransactionVerifier from "./components/TransactionVerifier";

// Define the PendingUser interface to match what's used in AdminDashboard.tsx
interface PendingUser {
	address: string;
	role: "institution" | "student";
	timestamp: number;
	paymentConfirmed?: boolean;
	transactionHash?: string;
	ipfsHash?: string;
	status?: string;
}

function AppContent() {
	const [showAurora, setShowAurora] = useState(true);
	const [showRoleModal, setShowRoleModal] = useState(false);
	const [selectedRole, setSelectedRole] = useState<"institution" | "student" | null>(null);
	const { scrollY } = useScroll();
	const account = useActiveAccount();
	const { disconnect } = useDisconnect();
	const navigate = useNavigate();
	const opacity = useTransform(
		scrollY,
		[0, window.innerHeight * 0.5],
		[1, 0]
	);

	// Check if connected account is admin
	const isAdmin = account?.address?.toLowerCase() === import.meta.env.VITE_ADMIN_ADDRESS?.toLowerCase();

	// Handle admin and role selection logic
	useEffect(() => {
		if (!account?.address) {
			console.log("No account connected, resetting states");
			setShowRoleModal(false);
			setSelectedRole(null);
			return;
		}

		console.log("Account connected:", account.address);
		
		// Check if connected account is admin
		if (isAdmin) {
			console.log("Admin user detected, redirecting to admin dashboard");
			navigate("/admin-dashboard");
			setShowRoleModal(false);
			setSelectedRole(null);
			window.localStorage.removeItem("selectedRole");
			return;
		}

		// Read directly from localStorage for the most up-to-date data
		console.log("Non-admin user, checking for existing role");
		
		// Check both role_address and approvedUsers to determine if user already has a role
		const normalizedAddress = account.address.toLowerCase();
		const userHasRole = checkIfUserHasRole(normalizedAddress);
		
		if (userHasRole) {
			console.log("User already has a role, no need to prompt for selection");
			setShowRoleModal(false);
			
			// Navigate to the appropriate dashboard
			const userRole = getUserRole(normalizedAddress);
			if (userRole) {
				setSelectedRole(userRole);
				navigateToDashboard(userRole);
			}
			return;
		}
		
		// If user doesn't have a role, show the role selection modal
		console.log("No role assigned, showing role modal");
		setShowRoleModal(true);
	}, [account, isAdmin, navigate]);

	// Helper function to check if user has a role in any storage format
	const checkIfUserHasRole = (address: string): boolean => {
		// Normalize the address for consistent matching
		const normalizedAddress = address.toLowerCase();
		console.log(`Checking if user ${normalizedAddress} has a role`);
		
		try {
			// Method 1: Check direct role storage (fastest)
			const userRoleDirectly = window.localStorage.getItem(`role_${normalizedAddress}`);
			if (userRoleDirectly) {
				console.log(`Found role in direct storage: ${userRoleDirectly}`);
				return true;
			}
			
			// Method 2: Check approvedUsers in localStorage
			const approvedData = window.localStorage.getItem("approvedUsers");
			if (approvedData) {
				const approvedUsers = JSON.parse(approvedData);
				const foundUser = approvedUsers.find(
					(user: any) => user.address && user.address.toLowerCase() === normalizedAddress
				);
				
				if (foundUser) {
					console.log(`Found user in approved users list: ${foundUser.role}`);
					// Save to direct storage for faster access next time
					window.localStorage.setItem(`role_${normalizedAddress}`, foundUser.role);
					return true;
				}
			}

			// Method 3: Check any recent transactions with this address
			const allKeys = Object.keys(window.localStorage);
			const transactionKeys = allKeys.filter(key => 
				key.startsWith("tx_") || 
				key.includes("Transaction") || 
				key.includes("ipfsMappings_")
			);
			
			for (const key of transactionKeys) {
				const data = window.localStorage.getItem(key);
				if (data && data.toLowerCase().includes(normalizedAddress)) {
					console.log(`Found address in transaction data: ${key}`);
					// Can't determine role, but user has transacted before, so set a default
					// This fallback ensures we don't prompt for role selection again
					window.localStorage.setItem(`role_${normalizedAddress}`, "student");
					return true;
				}
			}
			
			// Method 4: Last resort - check if we've seen this address in any role-mapping
			for (const key of allKeys) {
				if (key.includes(normalizedAddress) && window.localStorage.getItem(key)) {
					console.log(`Found address reference in localStorage: ${key}`);
					return true;
				}
			}
			
			console.log(`No role found for user ${normalizedAddress}`);
			return false;
		} catch (error) {
			console.error("Error checking user role:", error);
			return false;
		}
	};
	
	// Helper function to get user's role
	const getUserRole = (address: string): "institution" | "student" | null => {
		// Check direct role storage first (faster)
		const userRoleDirectly = window.localStorage.getItem(`role_${address}`);
		if (userRoleDirectly) {
			return userRoleDirectly as "institution" | "student";
		}
		
		// Fall back to approved users check
		try {
			const approvedData = window.localStorage.getItem("approvedUsers");
			if (approvedData) {
				const approvedUsers = JSON.parse(approvedData);
				const foundUser = approvedUsers.find(
					(user: any) => user.address.toLowerCase() === address
				);
				if (foundUser) {
					return foundUser.role as "institution" | "student";
				}
			}
		} catch (error) {
			console.error("Error getting user role:", error);
		}
		
		return null;
	};
	
	// Helper function to navigate to the appropriate dashboard
	const navigateToDashboard = (role: "institution" | "student") => {
		if (role === "institution") {
			navigate("/institution-dashboard");
		} else if (role === "student") {
			navigate("/student-dashboard");
		}
	};

	// Handle Aurora visibility based on scroll
	useEffect(() => {
		const handleScroll = () => {
			const heroSection = document.getElementById("hero");
			if (heroSection) {
				const rect = heroSection.getBoundingClientRect();
				const isVisible = rect.top >= -window.innerHeight * 0.5 && rect.bottom <= window.innerHeight * 1.5;
				setShowAurora(isVisible);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Always show Aurora on dashboard pages
	useEffect(() => {
		if (window.location.pathname !== "/") {
			setShowAurora(true);
		}
	}, []);

	const handleRoleSelect = (role: "institution" | "student") => {
		if (!account?.address) {
			console.error("No account address available for role selection");
			return;
		}

		console.log("handleRoleSelect triggered for address:", account.address, "with role:", role);

		// Store the selected role in state
		setSelectedRole(role);
		
		// Normalize address for consistency
		const normalizedAddress = account.address.toLowerCase();

		// Create a new approved user directly
		const newUser = {
			address: normalizedAddress,
			role: role,
			timestamp: Date.now(),
			paymentConfirmed: true,
			status: "approved", // Directly approve
		};
		console.log("New approved user created:", newUser);

		// Get existing approved users from localStorage
		let approvedUsers: any[] = [];
		try {
			const approvedData = window.localStorage.getItem("approvedUsers");
			approvedUsers = approvedData ? JSON.parse(approvedData) : [];
			console.log("Existing approvedUsers from localStorage:", approvedUsers);
		} catch (error) {
			console.error("Error parsing approvedUsers from localStorage:", error);
			approvedUsers = [];
		}

		// Remove any existing users with this address to avoid duplicates
		approvedUsers = approvedUsers.filter(
			(user: any) => user.address.toLowerCase() !== normalizedAddress
		);
		console.log("Approved users after filtering existing records:", approvedUsers);

		// Add the new approved user
		approvedUsers.push(newUser);
		console.log("Approved users after adding new user:", approvedUsers);

		// Save user data in multiple locations for persistent role tracking
		try {
			// 1. Save to approvedUsers array
			window.localStorage.setItem("approvedUsers", JSON.stringify(approvedUsers));
			
			// 2. Direct role storage (primary lookup method)
			window.localStorage.setItem(`role_${normalizedAddress}`, role);
			
			// 3. User-specific role
			window.localStorage.setItem(`user_role_${normalizedAddress}`, role);
			
			// 4. Mark as onboarded
			window.localStorage.setItem(`onboarded_${normalizedAddress}`, "true");
			
			// 5. User profile data
			window.localStorage.setItem(`profile_${normalizedAddress}`, JSON.stringify({
				address: normalizedAddress,
				role: role,
				timestamp: Date.now(),
				status: "active"
			}));
			
			console.log(`Role data for ${normalizedAddress} stored in multiple locations`);
		} catch (error) {
			console.error("Error saving role data to localStorage:", error);
		}

		// Hide modal and navigate directly to dashboard
		setShowRoleModal(false);
		
		// Navigate to appropriate dashboard based on role
		if (role === "institution") {
			navigate("/institution-dashboard");
		} else if (role === "student") {
			navigate("/student-dashboard");
		}
	};

	const handleConnect = () => {
		// This will be handled by the useEffect above
	};

	return (
		<>
			<div className="min-h-screen bg-black text-white overflow-hidden relative">
				{/* Global Squares Background */}
				<div className="fixed inset-0 z-0">
					<Squares 
						speed={0.3}
						squareSize={50}
						direction="diagonal"
						borderColor="rgba(63, 81, 181, 0.1)"
						hoverFillColor="rgba(63, 81, 181, 0.05)"
					/>
				</div>

				{/* Aurora Background */}
				<motion.div 
					className="fixed inset-0 z-0"
					style={{ opacity }}
				>
					<Aurora
						colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
						blend={0.5}
						amplitude={1.0}
						speed={0.5}
						visible={showAurora}
					/>
				</motion.div>

				{/* Navigation Bar */}
				<nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-purple-500/20">
					<div className="container mx-auto px-8 py-6">
						<div className="flex items-center justify-between">
							<motion.a 
								href="/"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 1 }}
								className="text-purple-500 tracking-[0.2em] text-base font-medium w-[250px]"
							>
								EDUCHAIN
							</motion.a>
							<div className="flex-1 flex items-center justify-center">
								<div className="flex items-center space-x-20">
									<a href="#features" className="nav-link text-base">FEATURES</a>
									<a href="#about" className="nav-link text-base">ABOUT</a>
									<a href="#partners" className="nav-link text-base">PARTNERS</a>
								</div>
							</div>
							<div className="w-[250px] flex justify-end pr-4">
								{!account ? (
									<ConnectButton
										client={client}
										appMetadata={{
											name: "EduChain",
											url: "https://educhain.tech",
										}}
									/>
								) : (
									<div className="flex items-center space-x-4">
										{isAdmin ? (
											<>
											<button
												onClick={() => navigate("/admin-dashboard")}
												className="px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-300"
											>
												Admin Dashboard
											</button>
											<button
												onClick={() => {
													// Get user address before disconnecting
													const userAddress = account?.address?.toLowerCase();
													
													// Only clear the session data, NOT the role data
													if (userAddress) {
														// Save the current role information
														const roleKeys = Object.keys(localStorage).filter(key => 
															key.startsWith(`role_${userAddress}`) || 
															key.startsWith(`user_role_${userAddress}`) ||
															key.startsWith(`onboarded_${userAddress}`) ||
															key.startsWith(`profile_${userAddress}`)
														);
														
														// Store role data temporarily
														const savedRoleData: Record<string, string> = {};
														roleKeys.forEach(key => {
															const value = localStorage.getItem(key);
															if (value) savedRoleData[key] = value;
														});
														
														// Get existing approved users
														let approvedUsers = [];
														try {
															const approvedData = localStorage.getItem("approvedUsers");
															if (approvedData) {
																approvedUsers = JSON.parse(approvedData);
															}
														} catch (e) {
															console.error("Error parsing approvedUsers:", e);
														}
														
														// Clear only session-related data
														const keysToPreserve = [
															...roleKeys, 
															"approvedUsers"
														];
														
														Object.keys(localStorage)
															.filter(key => !keysToPreserve.includes(key))
															.forEach(key => localStorage.removeItem(key));
															
														// Restore approvedUsers
														if (approvedUsers.length > 0) {
															localStorage.setItem("approvedUsers", JSON.stringify(approvedUsers));
														}
														
														// Restore role data
														Object.keys(savedRoleData).forEach(key => {
															localStorage.setItem(key, savedRoleData[key]);
														});
													}
													
													// Reset UI state
													setSelectedRole(null);
													setShowRoleModal(false);
													
													// Force refresh to disconnect wallet
													navigate("/");
													window.location.reload();
												}}
												className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all duration-300 text-red-500"
											>
												Disconnect
											</button>
											</>
										) : (
											<>
												<span className="text-sm text-gray-400">
													{(() => {
														const normalizedAddress = account.address.toLowerCase();
														const userRoleDirectly = localStorage.getItem(
															`role_${normalizedAddress}`
														);
														if (userRoleDirectly) {
															return `Role: ${
																userRoleDirectly.charAt(0).toUpperCase() +
																userRoleDirectly.slice(1)
															}`;
														}

														const approvedUsers = JSON.parse(
															localStorage.getItem("approvedUsers") || "[]"
														);
														const approvedUser = approvedUsers.find(
															(user: any) =>
																user.address.toLowerCase() === normalizedAddress
														);

														if (approvedUser && approvedUser.paymentConfirmed) {
															return `Role: ${
																approvedUser.role.charAt(0).toUpperCase() +
																approvedUser.role.slice(1)
															}`;
														}

														return "No Role Selected";
													})()}
												</span>
												<button
													onClick={() => {
														const normalizedAddress = account.address.toLowerCase();
														const userRoleDirectly = localStorage.getItem(
															`role_${normalizedAddress}`
														);
														console.log("Button click - role check:", {
															normalizedAddress,
															userRoleDirectly,
															roleKeys: Object.keys(localStorage).filter(key =>
																key.startsWith("role_")
															),
														});

														if (userRoleDirectly) {
															if (userRoleDirectly === "institution") {
																navigate("/institution-dashboard");
															} else if (userRoleDirectly === "student") {
																navigate("/student-dashboard");
															}
															return;
														}

														const approvedUsers = JSON.parse(
															localStorage.getItem("approvedUsers") || "[]"
														);
														const approvedUser = approvedUsers.find(
															(user: any) =>
																user.address.toLowerCase() === normalizedAddress
														);

														if (approvedUser && approvedUser.paymentConfirmed) {
															if (approvedUser.role === "institution") {
																navigate("/institution-dashboard");
															} else if (approvedUser.role === "student") {
																navigate("/student-dashboard");
															}
															return;
														}

														// Only show role selection if user has no role yet
														setShowRoleModal(true);
													}}
													className="px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-300"
												>
													{(() => {
														const normalizedAddress = account.address.toLowerCase();
														const userRoleDirectly = localStorage.getItem(
															`role_${normalizedAddress}`
														);
														if (userRoleDirectly) {
															return `${userRoleDirectly.charAt(0).toUpperCase() + userRoleDirectly.slice(1)} Dashboard`;
														}

														const approvedUsers = JSON.parse(
															localStorage.getItem("approvedUsers") || "[]"
														);
														const approvedUser = approvedUsers.find(
															(user: any) =>
																user.address.toLowerCase() === normalizedAddress
														);

														if (approvedUser && approvedUser.paymentConfirmed) {
															return `${approvedUser.role.charAt(0).toUpperCase() + approvedUser.role.slice(1)} Dashboard`;
														}

														return "Select Role";
													})()}
												</button>
												<button
													onClick={() => {
														// Get user address before disconnecting
														const userAddress = account?.address?.toLowerCase();
														
														// Only clear the session data, NOT the role data
														if (userAddress) {
															// Save the current role information
															const roleKeys = Object.keys(localStorage).filter(key => 
																key.startsWith(`role_${userAddress}`) || 
																key.startsWith(`user_role_${userAddress}`) ||
																key.startsWith(`onboarded_${userAddress}`) ||
																key.startsWith(`profile_${userAddress}`)
															);
															
															// Store role data temporarily
															const savedRoleData: Record<string, string> = {};
															roleKeys.forEach(key => {
																const value = localStorage.getItem(key);
																if (value) savedRoleData[key] = value;
															});
															
															// Get existing approved users
															let approvedUsers = [];
															try {
																const approvedData = localStorage.getItem("approvedUsers");
																if (approvedData) {
																	approvedUsers = JSON.parse(approvedData);
																}
															} catch (e) {
																console.error("Error parsing approvedUsers:", e);
															}
															
															// Clear only session-related data
															const keysToPreserve = [
																...roleKeys, 
																"approvedUsers"
															];
															
															Object.keys(localStorage)
																.filter(key => !keysToPreserve.includes(key))
																.forEach(key => localStorage.removeItem(key));
																
															// Restore approvedUsers
															if (approvedUsers.length > 0) {
																localStorage.setItem("approvedUsers", JSON.stringify(approvedUsers));
															}
															
															// Restore role data
															Object.keys(savedRoleData).forEach(key => {
																localStorage.setItem(key, savedRoleData[key]);
															});
														}
														
														// Reset UI state
														setSelectedRole(null);
														setShowRoleModal(false);
														
														// Force refresh to disconnect wallet
														navigate("/");
														window.location.reload();
													}}
													className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all duration-300 text-red-500"
												>
													Disconnect
												</button>
											</>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				</nav>

				{/* Role Selection Modal - Only show if user has no role */}
				{showRoleModal && !isAdmin && !selectedRole && (
					<RoleSelectionModal
						onSelectRole={handleRoleSelect}
						onClose={() => setShowRoleModal(false)}
					/>
				)}

				{/* Routes */}
				<Routes>
					<Route path="/" element={
						<>
							{/* Hero Section */}
							<section id="hero" className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 z-10">
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.8 }}
									className="text-center max-w-5xl mx-auto z-10"
								>
									<motion.h1 
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.8, delay: 0.2 }}
										className="text-6xl md:text-8xl font-light mb-6 leading-tight tracking-tight"
									>
										PURE <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#3A29FF] via-[#FF94B4] to-[#FF3232] animate-gradient">INNOVATION</span>
										<br />
										<span className="text-transparent bg-clip-text bg-gradient-to-br from-[#3A29FF] via-[#FF94B4] to-[#FF3232] animate-gradient">NEW</span> GENERATION
									</motion.h1>
									<motion.p 
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.8, delay: 0.4 }}
										className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto font-light tracking-wide"
									>
										Experience the future of decentralized technology with our next-generation blockchain platform
									</motion.p>
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.8, delay: 0.6 }}
										className="flex justify-center items-center mb-16"
									>
										{!account && (
											<div className="relative group">
												<div className="absolute -inset-0.5 bg-gradient-to-r from-[#3A29FF] via-[#FF94B4] to-[#FF3232] rounded-xl blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
												<div className="relative bg-black rounded-xl">
													<ConnectButton
														client={client}
														appMetadata={{
															name: "Synthack",
															url: "https://synthack.tech",
														}}
													/>
												</div>
											</div>
										)}
									</motion.div>
								</motion.div>

								<motion.div
									animate={{ y: [0, 10, 0] }}
									transition={{ duration: 2, repeat: Infinity }}
									className="absolute bottom-12 items-center justify-center -translate-x-1/2"
								>
									<ArrowDownIcon className="h-8 w-8 text-purple-500 animate-pulse" />
								</motion.div>
							</section>
							{/* Features Section */}
							<section id="features" className="relative py-32 px-4 z-10">
								<div className="max-w-6xl mx-auto">
									<motion.div
										initial={{ opacity: 0 }}
										whileInView={{ opacity: 1 }}
										transition={{ duration: 1 }}
										className="grid md:grid-cols-3 gap-8"
									>
										<FeatureCard
											icon={<SparklesIcon className="h-12 w-12 text-purple-500" />}
											title="ACADEMIC PASSPORT"
											description={
												<DecryptedText
													text="A secure digital wallet for students to store and manage their academic credentials with complete control and portability."
													animateOn="view"
													revealDirection="center"
													className="text-gray-400"
													encryptedClassName="text-gray-600"
													speed={30}
													maxIterations={8}
												/>
											}
										/>
										<FeatureCard
											icon={<ShieldCheckIcon className="h-12 w-12 text-purple-500" />}
											title="TAMPER-PROOF SECURITY"
											description={
												<DecryptedText
													text="Blockchain-powered verification with cryptographic signatures ensuring 100% credential authenticity and integrity."
													animateOn="view"
													revealDirection="center"
													className="text-gray-400"
													encryptedClassName="text-gray-600"
													speed={30}
													maxIterations={8}
												/>
											}
										/>
										<FeatureCard
											icon={<RocketLaunchIcon className="h-12 w-12 text-purple-500" />}
											title="INSTANT VERIFICATION"
											description={
												<DecryptedText
													text="Reduce verification time by 89% with our 24/7 automated credential verification system."
													animateOn="view"
													revealDirection="center"
													className="text-gray-400"
													encryptedClassName="text-gray-600"
													speed={30}
													maxIterations={8}
												/>
											}
										/>
									</motion.div>
								</div>
							</section>
							{/* About Section */}
							<section id="about" className="relative py-32 px-4 overflow-hidden z-10">
								<motion.div 
									initial={{ opacity: 0, y: 40 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.8 }}
									className="max-w-4xl mx-auto text-center"
								>
									<h2 className="text-3xl md:text-4xl font-light mb-6 tracking-tight">About EduChain</h2>
									<p className="text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
										EduChain is a revolutionary blockchain-based academic credential verification system that transforms how educational institutions issue, manage, and verify academic credentials. Our platform reduces verification time by 89% and administrative costs by 82%, while ensuring tamper-proof security through advanced blockchain technology.
									</p>
									<div className="grid md:grid-cols-3 gap-8 text-left">
										<div className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-lg">
											<h3 className="text-purple-500 font-light mb-3">Publisher Tool</h3>
											<p className="text-gray-400 text-sm">Enables institutions to issue secure digital credentials with cryptographic signatures.</p>
										</div>
										<div className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-lg">
											<h3 className="text-purple-500 font-light mb-3">Academic Passport</h3>
											<p className="text-gray-400 text-sm">Students' digital wallet for managing and sharing their verified credentials.</p>
										</div>
										<div className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-lg">
											<h3 className="text-purple-500 font-light mb-3">Verification Portal</h3>
											<p className="text-gray-400 text-sm">24/7 instant verification platform for employers and institutions.</p>
										</div>
									</div>
								</motion.div>
							</section>

							{/* Team Section */}
							<section id="partners" className="relative py-32 px-4 overflow-hidden z-10">
								<motion.div 
									initial={{ opacity: 0, y: 40 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.8 }}
									className="max-w-6xl mx-auto text-center"
								>
									<h2 className="text-3xl md:text-4xl font-light mb-6 tracking-tight">Meet Our Team</h2>
									<p className="text-gray-400 mb-12 max-w-2xl mx-auto">
										The innovative minds behind EduChain's blockchain revolution
									</p>
									<div className="relative w-full h-[600px] flex items-center justify-center">
										{/* Orb container with relative positioning for team members */}
										<div className="relative w-[500px] h-[500px] group">
											{/* The Orb */}
											<div className="absolute inset-0 z-0 pointer-events-auto">
												<Orb
													hoverIntensity={0.8}
													rotateOnHover={true}
													hue={240}
													forceHoverState={false}
												/>
											</div>

											{/* Rotating container for team members */}
											<motion.div 
												className="absolute inset-0 z-10 pointer-events-none"
												animate={{ rotate: 360 }}
												transition={{ 
													duration: 30,
													repeat: Infinity,
													ease: "linear"
												}}
											>
												{/* Top member */}
												<motion.div 
													className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
													animate={{ rotate: -360 }}
													transition={{ 
														duration: 30,
														repeat: Infinity,
														ease: "linear"
													}}
												>
													<div className="flex flex-col items-center space-y-3">
														<div className="h-32 w-32 rounded-full bg-purple-500/10 border-2 border-purple-500/20 overflow-hidden backdrop-blur-sm">
															<img 
																src="https://media.licdn.com/dms/image/v2/D4D03AQH-jGdrNyBaOQ/profile-displayphoto-shrink_400_400/B4DZOPaWyNHMAk-/0/1733277884553?e=1749686400&v=beta&t=KLkNnNTGhcuibyjup2oKiCqKSXaq9Wmdg8xC14t9oVw"
																alt="Likith"
																className="w-full h-full object-cover"
															/>
														</div>
													</div>
												</motion.div>

												{/* Right member */}
												<motion.div 
													className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2"
													animate={{ rotate: -360 }}
													transition={{ 
														duration: 30,
														repeat: Infinity,
														ease: "linear"
													}}
												>
													<div className="flex flex-col items-center space-y-3">
														<div className="h-32 w-32 rounded-full bg-purple-500/10 border-2 border-purple-500/20 overflow-hidden backdrop-blur-sm">
															<img 
																src="https://media.licdn.com/dms/image/v2/D5603AQHTzBVD38cS_w/profile-displayphoto-shrink_400_400/B56ZOSO4GeGsAk-/0/1733325194494?e=1749686400&v=beta&t=DGM3qsCqrltG1g8m5Cy1kpaw-0U3j8jB6hUsYDxKQWs"
																alt="Yusha"
																className="w-full h-full object-cover"
															/>
														</div>
													</div>
												</motion.div>

												{/* Bottom member */}
												<motion.div 
													className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
													animate={{ rotate: -360 }}
													transition={{ 
														duration: 30,
														repeat: Infinity,
														ease: "linear"
													}}
												>
													<div className="flex flex-col items-center space-y-3">
														<div className="h-32 w-32 rounded-full bg-purple-500/10 border-2 border-purple-500/20 overflow-hidden backdrop-blur-sm">
															<img 
																src="https://i.postimg.cc/05KbJhwD/Whats-App-Image-2025-04-11-at-15-33-54-b6f606de.jpg"
																alt="Ayan"
																className="w-full h-full object-cover"
															/>
														</div>
													</div>
												</motion.div>

												{/* Left member */}
												<motion.div 
													className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2"
													animate={{ rotate: -360 }}
													transition={{ 
														duration: 30,
														repeat: Infinity,
														ease: "linear"
													}}
												>
													<div className="flex flex-col items-center space-y-3">
														<div className="h-32 w-32 rounded-full bg-purple-500/10 border-2 border-purple-500/20 overflow-hidden backdrop-blur-sm">
															<img 
																src="https://media.licdn.com/dms/image/v2/D5603AQFDaxP6s-6CaQ/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1702226478191?e=1749686400&v=beta&t=Tlc9clA-jDzBOHcEDqHWz_TDeNSJXtdEu2qSeFjGtfk"
																alt="Suhas"
																className="w-full h-full object-cover"
															/>
														</div>
													</div>
												</motion.div>
											</motion.div>
										</div>
									</div>
								</motion.div>
							</section>
						</>
					} />
					<Route path="/admin-dashboard" element={
						<div className="relative z-10 min-h-screen flex items-center justify-center">
							<AdminDashboard />
						</div>
					} />
					<Route path="/institution-dashboard" element={
						<div className="relative z-10 min-h-screen flex items-center justify-center">
							<InstitutionDashboard />
						</div>
					} />
					<Route path="/student-dashboard" element={
						<div className="relative z-10 min-h-screen flex items-center justify-center">
							<StudentDashboard />
						</div>
					} />
					<Route path="/verify-transaction" element={<TransactionVerifier />} />
				</Routes>
			</div>
		</>
	);
}

export function App() {
	return (
		<Router>
			<AppContent />
		</Router>
	);
}

interface FeatureCardProps {
	icon: React.ReactNode;
	title: string;
	description: React.ReactNode;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8 }}
			viewport={{ once: true }}
			whileHover={{ scale: 1.02 }}
			className="p-8 rounded-none border border-purple-500/20 hover:border-purple-500 transition-all duration-300 bg-purple-500/5"
		>
			<div className="mb-6">{icon}</div>
			<h3 className="text-lg font-light tracking-[0.2em] mb-4 text-purple-500">{title}</h3>
			<p className="leading-relaxed font-light">{description}</p>
		</motion.div>
	);
}