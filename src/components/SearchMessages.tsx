import { memo } from 'react';

interface SearchMessagesProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  resultsCount: number;
}

export const SearchMessages = memo(({ 
  searchTerm, 
  onSearchChange, 
  resultsCount 
}: SearchMessagesProps) => {
  return (
    <div className="search-messages">
      <input
        type="text"
        placeholder="Search messages..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
      />
      {searchTerm && (
        <div className="search-results">
          Found {resultsCount} message{resultsCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
});

SearchMessages.displayName = 'SearchMessages';