import logo from './logo.svg';
import './App.css';
import DashboardHeader from './components/DashboardHeader';
import Search from './components/Search';
import React from 'react';
import { searchItems, getItemStats, getRecentScanStats, getRecentListings } from './api/client';
import Plot from 'plotly.js-dist';

function App() {
	const [searchTerm, setSearchTerm] = React.useState('');
	const [isLoading, setIsLoading] = React.useState(false);
	const [results, setResults] = React.useState([]);
	const [error, setError] = React.useState(null);
	const [suggestions, setSuggestions] = React.useState([]);
	const [showSuggestions, setShowSuggestions] = React.useState(false);
	const [selectedItem, setSelectedItem] = React.useState(null);
	const [itemStats, setItemStats] = React.useState(null);
	const [recentStats, setRecentStats] = React.useState(null);
	const [loadingStats, setLoadingStats] = React.useState(false);
	const [activeTab, setActiveTab] = React.useState('historical');
	const abortRef = React.useRef(null);
	const [recentListings, setRecentListings] = React.useState([]);

	const handleSearch = async (e) => {
		e.preventDefault();
		if (!searchTerm?.trim()) return;
		if (abortRef.current) abortRef.current.abort();
		const controller = new AbortController();
		abortRef.current = controller;
		setIsLoading(true);
		setError(null);
		setShowSuggestions(false);
		setSelectedItem(null);
		setItemStats(null);
		try {
			// Remove the limit parameter to get ALL results
			const data = await searchItems(searchTerm.trim(), controller.signal);
			const items = Array.isArray(data) ? data : data?.results ?? [];
			// Group by item_name and show unique items
			const uniqueItems = items.reduce((acc, item) => {
				if (!acc.find(existing => existing.item_name === item.item_name)) {
					acc.push(item);
				}
				return acc;
			}, []);
			setResults(uniqueItems);
		} catch (err) {
			if (err.name !== 'AbortError') setError(err.message || 'Search failed');
		} finally {
			setIsLoading(false);
		}
	};

	const handleInputChange = async (value) => {
		setSearchTerm(value);
		if (value.length >= 2) {
			try {
				// Remove the limit parameter for suggestions too
				const data = await searchItems(value, null);
				const items = Array.isArray(data) ? data : data?.results ?? [];
				// Group by item_name for suggestions
				const uniqueSuggestions = items.reduce((acc, item) => {
					if (!acc.find(existing => existing.item_name === item.item_name)) {
						acc.push(item);
					}
					return acc;
				}, []);
				setSuggestions(uniqueSuggestions);
				setShowSuggestions(true);
			} catch (err) {
				setSuggestions([]);
			}
		} else {
			setSuggestions([]);
			setShowSuggestions(false);
		}
	};

	const handleSuggestionClick = (item) => {
		setSearchTerm(item.item_name);
		setShowSuggestions(false);
		setSelectedItem(item);
		loadItemStats(item.item_name);
	};

	const handleItemClick = (item) => {
		setSelectedItem(item);
		loadItemStats(item.item_name);
		setActiveTab('historical'); // Reset to historical tab
	};

	const loadItemStats = async (itemName) => {
		setLoadingStats(true);
		try {
			const [historical, recent] = await Promise.all([
				getItemStats(itemName, null),
				getRecentScanStats(itemName, null)
			]);
			setItemStats(historical);
			setRecentStats(recent);
			
			// Get the actual listing data for the chart
			if (recent && recent.total_listings > 0) {
				const listingsData = await getRecentListings(itemName, null);
				// Extract the listings array from the response
				const listings = Array.isArray(listingsData) ? listingsData : listingsData?.listings || [];
				setRecentListings(listings);
			}
		} catch (err) {
			setError(err.message || 'Failed to load item statistics');
		} finally {
			setLoadingStats(false);
		}
	};

	const renderPriceChart = (listings) => {
		// Ensure listings is an array
		if (!Array.isArray(listings) || listings.length === 0) return null;

		// Sort listings by price for better visualization
		const sortedListings = [...listings].sort((a, b) => a.item_price - b.item_price);
		
		const trace = {
			x: sortedListings.map((_, index) => index + 1), // Listing number
			y: sortedListings.map(item => item.item_price || 0), // Price
			type: 'scatter',
			mode: 'markers',
			marker: {
				color: '#2196f3', // All dot  s same color since they're all "available" (quantity > 0)
				size: sortedListings.map(item => Math.max(6, Math.min(20, (item.item_available || 1) * 2))), // Size based on quantity
				line: {
					color: 'white',
					width: 1
				}
			},
			text: sortedListings.map(item => 
				`Price: ${item.item_price || 0}<br>Quantity: ${item.item_available || 1}`
			),
			hoverinfo: 'text'
		};

		const layout = {
			title: 'Price vs. Listing Order - Recent Listings',
			xaxis: { 
				title: 'Listing Number (sorted by price)',
				showgrid: true,
				gridcolor: '#f0f0f0'
			},
			yaxis: { 
				title: 'Price (Gold)',
				showgrid: true,
				gridcolor: '#f0f0f0'
			},
			height: 400,
			margin: { t: 50, b: 50, l: 60, r: 20 },
			showlegend: false,
			hovermode: 'closest',
			plot_bgcolor: 'rgba(0,0,0,0)',
			paper_bgcolor: 'rgba(0,0,0,0)'
		};

		const config = {
			responsive: true,
			displayModeBar: true,
			displaylogo: false,
			modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
		};

		// Use setTimeout to ensure DOM is ready
		setTimeout(() => {
			const chartDiv = document.getElementById('price-chart');
			if (chartDiv) {
				Plot.newPlot(chartDiv, [trace], layout, config);
			}
		}, 100);

		return <div id="price-chart" style={{ width: '100%', height: '400px' }} />;
	};

	const renderStatsGrid = (stats, title) => (
		<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
			<div style={{ textAlign: 'center', padding: 16, backgroundColor: 'white', borderRadius: 4 }}>
				<div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#2196f3' }}>
					{stats?.total_listings || 0}
				</div>
				<div style={{ color: '#666' }}>Total Listings</div>
			</div>
			<div style={{ textAlign: 'center', padding: 16, backgroundColor: 'white', borderRadius: 4 }}>
				<div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#4caf50' }}>
					{stats?.total_quantity || 0}
				</div>
				<div style={{ color: '#666' }}>Total Market Supply</div>
			</div>
			<div style={{ textAlign: 'center', padding: 16, backgroundColor: 'white', borderRadius: 4 }}>
				<div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#ff9800' }}>
					{stats?.median_price || 0}
				</div>
				<div style={{ color: '#666' }}>Median Price</div>
			</div>
			<div style={{ textAlign: 'center', padding: 16, backgroundColor: 'white', borderRadius: 4 }}>
				<div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#f44336' }}>
					{stats?.avg_price || 0}
				</div>
				<div style={{ color: '#666' }}>Average Price</div>
			</div>
			<div style={{ textAlign: 'center', padding: 16, backgroundColor: 'white', borderRadius: 4 }}>
				<div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#9c27b0' }}>
					{stats?.min_price || 0}
				</div>
				<div style={{ color: '#666' }}>Lowest Price</div>
			</div>
			<div style={{ textAlign: 'center', padding: 16, backgroundColor: 'white', borderRadius: 4 }}>
				<div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#795548' }}>
					{stats?.max_price || 0}
				</div>
				<div style={{ color: '#666' }}>Highest Price</div>
			</div>
		</div>
	);

	return (
		<div className="App">
			<DashboardHeader />
			{/* <div className="dashboard-container"> */}
				<Search
					searchTerm={searchTerm}
					setSearchTerm={handleInputChange}
					handleSearch={handleSearch}
					isLoading={isLoading}
					suggestions={suggestions}
					showSuggestions={showSuggestions}
					onSuggestionClick={handleSuggestionClick}
				/>
				{error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
				
				{/* Search Results - Unique Items */}
				{results?.length > 0 && (
					<div style={{ marginTop: 16 }}>
						<h3>Search Results</h3>
						<div style={{ display: 'grid', gap: 8 }}>
							{results.map((item) => (
								<div 
									key={item.id} 
									style={{ 
										border: '1px solid #ddd', 
										padding: 12, 
										borderRadius: 4,
										backgroundColor: selectedItem?.id === item.id ? '#e3f2fd' : '#f9f9f9',
										cursor: 'pointer'
									}}
									onClick={() => handleItemClick(item)}
								>
									<div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
										{item.item_name}
									</div>
									<div style={{ color: '#666', marginTop: 4 }}>
										Tier: {item.item_tier} | GS: {item.item_gearscore}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Item Statistics Dashboard with Tabs */}
				{selectedItem && (
					<div style={{ marginTop: 24, padding: 20, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
						<h2>{selectedItem.item_name} - Market Statistics</h2>
						
						{/* Tab Navigation */}
						<div style={{ display: 'flex', marginBottom: 20, borderBottom: '1px solid #ddd' }}>
							<button
								onClick={() => setActiveTab('historical')}
								style={{
									padding: '10px 20px',
									border: 'none',
									backgroundColor: activeTab === 'historical' ? '#2196f3' : 'transparent',
									color: activeTab === 'historical' ? 'white' : '#666',
									cursor: 'pointer',
									borderRadius: '4px 4px 0 0',
									fontWeight: activeTab === 'historical' ? 'bold' : 'normal'
								}}
							>
								Historical Market Data
							</button>
							<button
								onClick={() => setActiveTab('recent')}
								style={{
									padding: '10px 20px',
									border: 'none',
									backgroundColor: activeTab === 'recent' ? '#2196f3' : 'transparent',
									color: activeTab === 'recent' ? 'white' : '#666',
									cursor: 'pointer',
									borderRadius: '4px 4px 0 0',
									fontWeight: activeTab === 'recent' ? 'bold' : 'normal'
								}}
							>
								Most Recent Upload
							</button>
						</div>

						{loadingStats ? (
							<div>Loading statistics...</div>
						) : (
							<>
								{activeTab === 'historical' && itemStats && (
									<div>
										<h3>All-Time Market Statistics</h3>
										{renderStatsGrid(itemStats)}
									</div>
								)}
								
								{activeTab === 'recent' && recentStats && (
									<div>
										<h3>Most Recent Upload Statistics</h3>
										<div style={{ color: '#666', marginBottom: 16 }}>
											Last updated: {recentStats.upload_timestamp || 'Unknown'}
										</div>
										{renderStatsGrid(recentStats)}
										
										{/* Price Distribution Chart */}
										<div style={{ marginTop: 24 }}>
											<h4>Price Distribution</h4>
											{renderPriceChart(recentListings)}
										</div>
									</div>
								)}
							</>
						)}
					</div>
				)}
			{/* </div> */}
		</div>
	);
}
 
 export default App;