import React from 'react';
import '../styles/Search.css';

function Search({ 
	searchTerm, 
	setSearchTerm, 
	handleSearch, 
	isLoading, 
	suggestions, 
	showSuggestions, 
	onSuggestionClick 
}) {
	return (
		<section className="search-section">
			<form onSubmit={handleSearch} className="search-form">
				<div className="search-container">
					<div className="input-wrapper">
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Search items"
							className="search-input"
							disabled={isLoading}
						/>
						{showSuggestions && suggestions.length > 0 && (
							<div className="suggestions-dropdown">
								{suggestions.map((item) => (
									<div
										key={item.id}
										className="suggestion-item"
										onClick={() => onSuggestionClick(item)}
									>
										<div className="suggestion-name">{item.item_name}</div>
										<div className="suggestion-details">
											Tier {item.item_tier} | GS {item.item_gearscore}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
					<button 
						type="submit" 
						className="search-button"
						disabled={isLoading}
					>
						{isLoading ? 'Searching...' : 'Search'}
					</button>
				</div>
			</form>
		</section>
	);
}

export default Search;