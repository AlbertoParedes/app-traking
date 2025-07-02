import styled from 'styled-components';

export const Container = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const Title = styled.h1`
  margin: 0px;
  padding: 0px;
  font-size: 32px;
  padding-top: 24px;
  padding-left: 24px;
  padding-right: 24px;
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  margin-top: 12px;
  margin-bottom: 24px;
  padding-left: 24px;
  padding-right: 24px;
`;
export const LeftContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 24px;
`;
export const RightContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
`;

export const TableContent = styled.div`
  flex: 1;
  overflow: auto;
  padding-left: 24px;
  padding-right: 24px;
  padding-bottom: 24px;
  & > div {
    height: -webkit-fill-available;
  }

  & table {
    & th:first-child {
      width: 50px;
      min-width: 50px;
      max-width: 50px;
    }
    & td:first-child {
      width: 50px;
      min-width: 50px;
      max-width: 50px;
    }

    & th:nth-child(3) {
      width: 100px;
      min-width: 100px;
      max-width: 100px;
    }
    & td:nth-child(3) {
      width: 100px;
      min-width: 100px;
      max-width: 100px;
    }

    & th:nth-child(4) {
      width: 130px;
      min-width: 130px;
      max-width: 130px;
    }
    & td:nth-child(4) {
      width: 130px;
      min-width: 130px;
      max-width: 130px;
    }

    & th:nth-child(5) {
      width: 80px;
      min-width: 80px;
      max-width: 80px;
    }
    & td:nth-child(5) {
      width: 80px;
      min-width: 80px;
      max-width: 80px;
    }

    & th:nth-child(6) {
      width: 100px;
      min-width: 100px;
      max-width: 100px;
    }
    & td:nth-child(6) {
      width: 100px;
      min-width: 100px;
      max-width: 100px;
    }
  }
`;

export const InputDate = styled.div`
  & div[role='group'] {
    cursor: unset;
    & [data-slot='input-field'] {
      user-select: none;
      pointer-events: none;

      & [data-type='day'] {
        order: 1 !important;
      }

      & [data-type='literal']:nth-child(2) {
        order: 2 !important;
      }

      & [data-type='month'] {
        order: 3 !important;
      }

      & [data-type='literal']:nth-child(4) {
        order: 4 !important;
      }

      & [data-type='year'] {
        order: 5 !important;
      }
    }
  }
`;

export const Footer = styled.div`
  position: sticky;
  bottom: 0;
  padding: 8px 0px;
  z-index: 10;
`;

export const Info = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
`;

export const PositionContainer = styled.div`
  display: flex;
  gap: 4px;
`;

export const InfoContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding-left: 24px;
  padding-right: 24px;
  gap: 12px;
`;

export const InfoActions = styled.div`
  display: flex;
  align-items: center;
`;
