import { Alert, Box } from '@mui/material';

// Site-wide notice above the header, as on the existing site: red for errors (planned outages), green otherwise.
// It is announced to screen readers as soon as the page loads.
export default function AlertBanner({ alert }) {
  if (!alert) return null;
  const background = alert.type === 'Error' ? '#ffcdd2' : '#e8f5e9';
  return <Box role="alert" aria-live="assertive" aria-atomic="true" sx={{ width: '100%', display: 'flex', justifyContent: 'center', bgcolor: background }}>
    <Alert icon={false} sx={{ width: '125rem', bgcolor: background, '& .MuiAlert-message': { fontSize: '1.6rem' } }}><div dangerouslySetInnerHTML={{ __html: alert.message }} /></Alert>
  </Box>;
}
