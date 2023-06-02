import { Card, EmptyState, Page } from "@shopify/polaris";
import { notFoundImage } from "../assets";
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigateTo = useNavigate();
  
  return (
    <Page>
      <Card>
        <Card.Section>
          <EmptyState
            heading="There is no page at this address"
            image={notFoundImage}
          >
            <p>
              Check the URL and try again, or use the search bar to find what
              you need.
            </p>
          </EmptyState>
        </Card.Section>
      </Card>
    </Page>
  );
}
